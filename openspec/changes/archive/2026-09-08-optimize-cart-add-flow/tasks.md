## 1. Confirmed Cart Handoff

- [x] 1.1 Extend the existing aside coordination state to retain the latest usable successful add response as an ephemeral confirmed-cart snapshot, with cart identity and freshness data, and verify existing cart-add animation consumers remain type-safe.
- [x] 1.2 Publish a snapshot only for a successful add response with a usable cart and no blocking cart errors, while preserving the current failed-add and feedback behavior; verify failed responses do not replace the confirmed snapshot.

## 2. Drawer Rendering

- [x] 2.1 Make the cart drawer prefer a newer confirmed action snapshot over stale root cart data, then reconcile to root loader data when it catches up; verify exact Shopify line prices and totals appear without waiting for the second cart refresh.
- [x] 2.2 Preserve Hydrogen optimistic rendering for pending lines and quantities while keeping unconfirmed monetary fields pending; verify no client-calculated provisional price or total is rendered.
- [x] 2.3 Keep snapshot consumption scoped to the cart aside and preserve the `/cart` page's server-loaded behavior; verify the cart page has no drawer snapshot presentation or regression in cart controls.
- [x] 2.4 Handle rapid or concurrent adds without duplicate lines or an older confirmed response overwriting a newer one; verify with repeated adds of new and existing variants.

## 3. Payload Measurement

- [x] 3.1 Measure the add action response and follow-up root cart refresh in the browser before changing GraphQL selections; record whether mutation payload size or the extra refresh is a material bottleneck. Measurement: `POST /cart.data` was about 1.9s and 2.28KB encoded, while the follow-up product/root data response was about 2.0s and 18.4KB encoded.
- [x] 3.2 If measurement justifies reducing `CART_MUTATE_FRAGMENT`, audit every cart action consumer, update the fragment narrowly, regenerate Storefront types, and verify the cart action response still contains every required drawer field; otherwise document that the fragment remains unchanged. The action payload was small in the measured run, so the fragment remains unchanged.

## 4. Validation

- [x] 4.1 Run `npm run typecheck` and `npm run lint`, resolving only regressions caused by this change. Typecheck and changed-file ESLint pass; full-repository lint still reports pre-existing errors in `singhar-by-sidra-mockup-design/project/support.js`.
- [x] 4.2 Run the actual development command and validate successful new-line adds, merged-line adds, failed adds, rapid adds, pending prices, drawer dismissal, quantity/removal controls, checkout, and `/cart` behavior at desktop and mobile viewport sizes using the repository's Playwright workflow. Validated at `390x844` and `1280x900`; the live test cart was used for success/merge checks, and a valid simulated cart-error response verified the confirmed snapshot remains visible.
- [x] 4.3 Inspect browser console errors, failed requests, cart response timing, stale-snapshot reconciliation, keyboard focus, and reduced-motion behavior, and verify no private cart or customer data is exposed to the browser beyond existing cart UI data. No failed requests were observed; the only console error is the existing missing `PUBLIC_CHECKOUT_DOMAIN` analytics configuration warning, and reduced-motion transitions resolve to `0.00001s`.
