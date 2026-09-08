## Why

Adding a product opens the cart drawer before the cart mutation has completed, but the drawer currently waits for root cart revalidation before showing Shopify-confirmed line prices and totals. This makes a successful add feel slow even though Hydrogen already provides optimistic line and quantity feedback.

## What Changes

- Add a cart-add performance capability for the drawer flow.
- Use the successful `/cart` action response as the drawer's immediate confirmed cart snapshot.
- Keep Hydrogen `CartForm` and `useOptimisticCart` for pending line and quantity feedback.
- Allow root cart revalidation to reconcile the snapshot in the background.
- Render only Shopify-confirmed prices and totals; do not show client-calculated provisional totals.
- Preserve cart error handling, failed-add behavior, existing cart-page behavior, and the current server-owned cart architecture.
- Measure the cart mutation payload before considering any narrowing of the shared mutation fragment.

## Capabilities

### New Capabilities

- `cart-add-performance`: Provides rapid, server-confirmed cart drawer updates after a successful add-to-cart action.

### Modified Capabilities

<!-- Existing animation requirements remain unchanged. -->

## Impact

- Affects the add-to-cart action result handoff and cart drawer rendering in `app/components/AddToCartButton.tsx`, `app/components/Aside.tsx`, `app/components/PageLayout.tsx`, and `app/components/CartMain.tsx`.
- May affect the cart mutation selection in `app/lib/fragments.ts` only if measurement shows a safe payload reduction is worthwhile.
- Requires Hydrogen-compatible route/action behavior, Storefront API code generation if GraphQL changes are made, TypeScript and lint validation, and desktop/mobile browser validation of add, error, and reconciliation states.
- Adds no dependency, browser-side Shopify request, parallel cart store, route, or checkout behavior.
