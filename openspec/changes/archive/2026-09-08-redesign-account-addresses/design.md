## Context

See `proposal.md` for the motivation and `specs/account-addresses/spec.md` for the observable behavior contract.

The account layout currently loads the authenticated customer through the Customer Account API and renders a generic horizontal navigation around an outlet. The Addresses route already uses the authenticated customer from that layout and already dispatches Customer Account API create, update, and delete address mutations. The customer query intentionally retrieves six addresses, and the current visual tokens, header, footer, and aside patterns in `app/styles/tailwind.css` already match the approved Singhar by Sidra visual language.

The Customer Account API supports address fields, default-address flags, and address mutation user errors. It does not support customer-defined address labels or address types. Customer Account API requests must remain authenticated and private because the page handles protected customer data.

## Goals / Non-Goals

**Goals:**

- Establish a shared account shell that matches the mockup without changing account URLs, authentication, or existing order/profile data behavior.
- Make the Addresses route a responsive card-based management page with one active add/edit form.
- Keep all customer data reads and writes on the server through the existing Customer Account API integration.
- Make address mutation states, errors, confirmation, and keyboard interaction explicit and accessible.
- Reuse the existing visual tokens and shared storefront layout instead of adding dependencies or a second styling system.

**Non-Goals:**

- Add address labels, address types, wishlist persistence, or a new customer-data store.
- Add cursor pagination or increase the existing six-address retrieval boundary.
- Add email, phone, password, date-of-birth, payment-method, or marketing-preference management.
- Change Customer Account authentication, checkout, order behavior, or market routing.

## Decisions

### Use the existing account route hierarchy

The account parent remains the authenticated layout boundary and continues to provide customer context to child routes. Its presentation changes from the pipe-separated menu to a breadcrumb plus account navigation. The Addresses child owns the page title and address content, while existing child route URLs and data flows remain unchanged.

Alternative considered: create a separate standalone Addresses route or duplicate the account navigation inside the page. This would bypass the existing authenticated hierarchy and create inconsistent navigation across account pages.

### Keep Customer Account API address mutations as the only data boundary

The page will use the existing Customer Account API query and create, update, and delete mutations through server-side route loaders and actions. Form submissions will remain same-origin React Router form submissions. No browser-side Shopify fetches, custom address store, or optimistic removal of confirmed address cards will be introduced.

The supported address input remains the API's `CustomerAddressInput`: first name, last name, company, address lines, city, zone code, postal code, territory code, and phone number. The default checkbox maps to the API default-address argument. API GraphQL errors and mutation user errors remain available to the page's safe error presentation.

Alternative considered: introduce a client-side address state to make the mockup interactions feel immediate. This risks stale or fabricated customer data and would duplicate server authority.

### Use one inline add/edit form at a time

The page will keep the mockup's inline form pattern, but only one form can be open for either creating a new address or editing an existing address. The cards remain read-focused until the customer selects Edit. This avoids rendering duplicate controls and duplicate field identifiers for every address while preserving the mockup's compact layout.

The form will use semantic fieldsets and labels, stable unique IDs derived from the active address context, browser autocomplete attributes, and a default-address control. On a failed mutation, the active form remains available and displays the returned error. On success, the account data is revalidated and the form closes only after the server-confirmed result is available.

Alternative considered: render a complete edit form inside every card. The current route follows this pattern, but it creates invalid duplicate IDs, increases page complexity, and does not match the approved mockup.

### Use inline removal confirmation

Selecting Remove will reveal an inline confirmation state in that card with explicit cancel and confirm controls. The card remains present until the confirmed delete mutation succeeds. This avoids a browser-blocking confirmation dialog and avoids introducing a modal focus-trap implementation for a simple destructive action.

### Represent addresses with API-backed neutral headings

Cards will use neutral presentation text such as an address ordinal or “Saved address,” plus a Default badge when applicable. They will display Shopify's returned name, formatted address, and phone value. The design will not collect or render “Home,” “Office,” or “Shipping” labels because those values are not part of the Customer Account API address model.

### Use CSS-first responsive composition

The account shell and address page will use the existing Tailwind v4 stylesheet and tokens. Desktop widths will use a two-column account layout with a 240px navigation rail and address content capped near the mockup's 760px content width. Mobile widths will collapse the rail and stack address cards and form controls without horizontal page overflow. Motion will remain subtle and will be disabled or reduced under `prefers-reduced-motion`.

## Risks / Trade-offs

- [Six-address boundary can hide additional saved addresses] -> Keep the limitation explicit in the specification and UI behavior; do not show pagination affordances or claim the list is exhaustive.
- [Protected customer fields may be redacted or unavailable for an installation] -> Request only the fields needed for address management, preserve API errors, render safe fallback text, and keep account responses private or no-store.
- [Shared shell styling can visually affect orders and profile routes] -> Keep their loaders, actions, URLs, and commerce behavior unchanged, then validate those routes for layout regressions as part of browser review.
- [Concurrent form submissions can produce stale feedback] -> Keep one active add/edit form, disable the submitting controls, and use the server-confirmed revalidation result before closing or removing UI.
- [Deleting the default address may have store-specific resulting behavior] -> Do not invent a replacement-default rule; render the refreshed default status returned by Shopify after the mutation.
- [Address formatting can vary by locale] -> Prefer the Customer Account API's formatted address output and retain structured fields only for form values.

## Migration Plan

1. Update the account shell, Addresses route presentation, and account-specific styling in one deployable change.
2. Keep the existing Customer Account API operation names and mutation payload boundary unless codegen or schema validation identifies a required compatible adjustment.
3. Run the repository's code generation and type checking when GraphQL or route types change, followed by lint and production build validation.
4. Validate the authenticated Addresses route against a safe linked environment at desktop and mobile viewport sizes, including add, edit, default, delete-cancel, delete-success, API-error, empty, and keyboard states.
5. Roll back by reverting the account shell, Addresses route, and account styling changes. No customer data migration or API rollback is required.

Relevant references:

- [Hydrogen Customer Account client](https://shopify.dev/docs/api/hydrogen/2026-04/utilities/createcustomeraccountclient)
- [Manage customer accounts](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/customer-accounts)
- [CustomerAddressInput](https://shopify.dev/docs/api/customer/2026-04/input-objects/CustomerAddressInput)
- [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data)
