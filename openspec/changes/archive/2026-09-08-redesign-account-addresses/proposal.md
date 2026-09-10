## Why

The authenticated account area is functional but still uses the generic Hydrogen starter presentation, while the approved Singhar by Sidra mockup defines a more polished responsive account experience. The Addresses page is the best first target because its core create, update, delete, and default-address behavior is already supported by the Customer Account API.

## What Changes

- Add a mockup-aligned responsive account shell with breadcrumb navigation, a desktop account sidebar, mobile-friendly navigation, and consistent active and sign-out states.
- Redesign `/account/addresses` with responsive address cards, default-address status, inline add/edit forms, an empty state, and clear loading and error feedback.
- Preserve the existing Hydrogen server-loader/action architecture and Customer Account API address mutations.
- Improve address form semantics and interaction safety, including unique field identifiers, accessible labels, field-level errors, disabled submitting states, and delete confirmation.
- Omit unsupported customer-defined address labels and address types such as “Home,” “Office,” and “Shipping.”
- Keep wishlist functionality and persistence out of the account area.
- Keep the current six-address retrieval boundary; cursor pagination is outside this change.

## Capabilities

### New Capabilities

- `account-addresses`: Authenticated customers can view and manage their saved addresses through a responsive, Shopify Customer Account API-backed page.

### Modified Capabilities

None.

## Impact

- Account layout and navigation: `app/routes/account.tsx`.
- Address page presentation and form interactions: `app/routes/account.addresses.tsx`.
- Account-specific responsive styling and existing visual tokens: `app/styles/tailwind.css`.
- Existing Customer Account operations in `app/graphql/customer-account/` remain the data boundary; no new dependency or client-side Shopify API access is required.
- The shared account shell will affect the presentation of existing orders and profile routes without changing their commerce behavior.
- Customer name, address, phone, and order data remains protected customer data and must continue to use authenticated, private server-side handling.
