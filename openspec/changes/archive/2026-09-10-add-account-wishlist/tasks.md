## 1. Shopify Readiness and API Operations

- [x] 1.1 Verify in a safe linked Shopify store that Customer metafield `custom.wishlist` exists with type `list.product_reference`, the `customer_read_customers` and `customer_write_customers` scopes are available, and protected customer data access is approved; record the verification result before exposing Wishlist navigation
- [x] 1.2 Add a narrow Customer Account API wishlist query under `app/graphql/customer-account/` that reads the authenticated customer's ID, `custom.wishlist` `jsonValue`, `type`, and `compareDigest`, and add the `metafieldsSet` mutation requesting returned metafields and `userErrors`; verify `npm run codegen` succeeds and generated Customer Account operation types contain the selected fields
- [x] 1.3 Add the narrow Storefront API product-node operation needed to resolve saved Product GIDs, including product identity, handle, title, featured image, availability, price, variant count, and the single available variant needed for direct cart actions; verify `npm run codegen` succeeds without manually editing generated declarations

## 2. Server-Side Wishlist Data and Mutations

- [x] 2.1 Add a focused wishlist data helper that validates the Customer metafield JSON as an ordered, duplicate-free list of at most 128 `gid://shopify/Product/` IDs and safely handles null, malformed, or unsupported values; verify `npm run typecheck` passes and invalid values cannot reach Storefront API variables
- [x] 2.2 Implement the authenticated `/account/wishlist` loader using `context.customerAccount` and the Storefront API, preserving metafield order while mapping unresolved product nodes to removable unavailable entries; verify the loader returns no customer tokens and keeps the route response private/no-store
- [x] 2.3 Implement the Wishlist route action with allow-listed `add` and `remove` intents, server-side customer ownership, idempotent ordered updates, and `metafieldsSet` compare-and-set handling including `compareDigest: null` for creation; verify forged owner/list/digest form fields are ignored or rejected and Shopify `userErrors` are preserved as safe action errors
- [x] 2.4 Add conflict, GraphQL-error, malformed-metafield, and unavailable-product handling without leaking raw server details; verify failed mutations leave the rendered item/state unchanged and return a retryable user-facing message

## 3. Account Route and Navigation

- [x] 3.1 Add `app/routes/account.wishlist.tsx` under the existing authenticated account layout with route metadata, loader/action wiring, item count, empty state, unavailable-item removal, and per-item pending/error state; verify unauthenticated requests use the established Customer Account login flow
- [x] 3.2 Add Wishlist to the account title mapping and desktop/mobile account navigation in `app/routes/account.tsx`, and add the same destination to the account drawer in `app/components/PageLayout.tsx`; verify active/current styling and links are correct at `/account/wishlist` without changing existing account destinations
- [x] 3.3 Ensure Wishlist responses and all personalized action responses retain private/no-store cache headers and do not alter the existing account route cache policy; verify headers with a local request or browser network inspection

## 4. Product Surfaces and Cart Behavior

- [x] 4.1 Add a shared same-origin Wishlist save control that submits only the product GID and an allow-listed intent through a React Router form/fetcher, reports server-confirmed saved state, handles pending/errors, and follows the established login flow for guests; verify no browser-side Shopify request, token, localStorage, cookie, or guest persistence is introduced
- [x] 4.2 Integrate the save control into the existing product-card and product-detail surfaces only when the Shopify Wishlist prerequisite is released; verify the control has a meaningful accessible name/pressed state and does not introduce layout overflow on mobile
- [x] 4.3 Build the Wishlist product card using real Hydrogen `Image` and `Money` components, product links, current availability, and explicit remove controls; verify no hard-coded product data or unsupported mockup-only labels/swatches are rendered
- [x] 4.4 Connect purchase actions to the existing Hydrogen cart flow: add the sole available variant only for a single-variant product, link multi-variant products to the PDP/options, and disable direct purchase for sold-out or unavailable products; verify no arbitrary variant is added and cart analytics/checkout behavior remains unchanged

## 5. Responsive UI and Accessible States

- [x] 5.1 Add scoped Tailwind v4 styling matching the approved Wishlist mockup's account rail, breadcrumb, four-column desktop grid, mobile account menu, two-column mobile grid, image ratios, spacing, typography, and controls; verify the page has no horizontal scrolling at desktop and mobile widths
- [x] 5.2 Implement empty, loading, disabled, unavailable, sold-out, mutation-error, and retry states with semantic headings, labels, focus styles, `aria-busy`/live feedback where needed, and reduced-motion behavior; verify keyboard navigation reaches save, remove, product, collection, and purchase controls in a usable order
- [x] 5.3 Remove prototype-only demo state, simulated add timers, placeholder products/images, and customer-defined labels from the production implementation; verify all visible content comes from Shopify data or approved storefront copy

## 6. Validation and Storefront Review

- [x] 6.1 Run `npm run codegen`, `npm run typecheck`, and `npm run lint` after the implementation; verify all commands succeed and generated files are not manually modified
- [x] 6.2 Run `npm run dev` against a safe linked environment and exercise authenticated empty/populated Wishlist, save, duplicate save, remove, compare conflict, API error, unresolved product, sold-out product, single-variant cart, multi-variant options, and guest-login flows; verify each behavior matches the account-wishlist specification
- [x] 6.3 Use Playwright CLI to inspect the account Wishlist and product save surfaces at desktop and mobile viewport sizes, including focus, pending/error states, overflow, console errors, and failed network requests; verify no customer credentials or tokens appear in page data or requests
