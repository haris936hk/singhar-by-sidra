## Context

The product page opens the cart aside immediately on button activation. The add action is submitted through Hydrogen's cart form, while the root loader supplies the cart through deferred data and revalidates after mutations. Hydrogen's optimistic cart can render the submitted variant and quantity while the action is pending, but it does not synthesize line costs or cart totals.

The current add-to-cart feedback signal already receives the successful action cart for aside animations. The drawer does not use that exact response as its display source, so confirmed prices wait for the subsequent root `cart.get()` revalidation. See `proposal.md` and `specs/cart-add-performance/spec.md` for the motivation and behavior contract.

## Goals / Non-Goals

**Goals:**

- Make the successful action response the earliest source for exact drawer prices and totals.
- Preserve immediate optimistic line and quantity feedback while the action is pending.
- Reconcile the temporary action result with root loader data without changing Shopify cart ownership.
- Keep drawer-only behavior separate from the `/cart` page.
- Preserve existing add failures, animation feedback, cart controls, and root revalidation.

**Non-Goals:**

- Calculating provisional prices, discounts, taxes, or totals in the browser.
- Replacing Hydrogen's cart handler, `CartForm`, or `useOptimisticCart`.
- Introducing a durable client cart store, browser-side Shopify requests, or a new cart route.
- Removing root revalidation or changing unrelated cart mutations.
- Narrowing the shared mutation fragment without measured evidence and complete field review.

## Decisions

### 1. Use the successful add response as an ephemeral drawer snapshot

The existing aside coordination boundary will carry the latest usable successful add result as a short-lived display snapshot. The cart drawer will prefer this snapshot when it is newer than the root cart data, then allow root revalidation to replace it once the loader catches up.

This reuses the response already returned by the server action and avoids a second browser request or a parallel cart model. A freshness check based on cart identity and `updatedAt` prevents an older root response from replacing a newer confirmed result. The snapshot remains scoped to the drawer; the cart page continues to consume its route loader data.

**Alternatives considered:**

- Waiting for root revalidation before rendering confirmed prices: preserves the current architecture but leaves the avoidable visible delay.
- Calculating prices from the product variant: appears faster but can disagree with Shopify discounts, market pricing, selling plans, cart transforms, or future tax rules.
- Removing root revalidation: reduces a request but risks stale header, analytics, and cart data and requires a separate synchronization mechanism.
- Adding a global client cart store: duplicates Hydrogen's cart ownership and increases reconciliation and failure complexity.

### 2. Keep Hydrogen optimistic state for pending content only

The drawer will continue to use `useOptimisticCart` for the pending submitted line and total quantity. Pending lines may show their available product data immediately, while cost fields remain pending until the successful action cart provides Shopify-confirmed values. Optimistic lines continue to keep unsupported quantity and removal actions disabled as they are today.

This follows the installed Hydrogen contract instead of extending the optimistic hook with locally invented monetary state.

### 3. Preserve the existing root refresh as background reconciliation

The mutation-triggered root revalidation will remain enabled. The action snapshot improves the first confirmed render, while the root loader remains the authoritative reconciliation path for shared layout data and later navigation. The implementation will not use a response-level public cache for cart data.

### 4. Accept only usable successful action results

The snapshot will be published only when the action returns a cart that contains the fields required by the drawer and has no blocking cart errors. Failed or unusable results will not replace the last confirmed drawer state or trigger a success-price presentation. Existing animation feedback will continue to use the same success boundary.

### 5. Treat concurrent additions as ordered confirmed snapshots

Rapid adds must not cause an older action result to overwrite a newer one. Snapshot publication will retain the newest confirmed cart according to the available cart freshness data, while still allowing pending fetchers to be layered by Hydrogen's optimistic cart behavior. Root reconciliation remains the final recovery path if concurrent responses cannot be totally ordered client-side.

### 6. Measure before changing GraphQL selections

The current mutation fragment will not be narrowed as part of the primary handoff unless profiling demonstrates that its response size or field selection is a material bottleneck. If a reduction is justified, all cart action consumers and generated Storefront types must be reviewed, followed by code generation and type validation.

## Risks / Trade-offs

- [Risk] A root cart response can arrive after the action response and appear older. -> [Mitigation] Prefer the newer matching cart snapshot and reconcile by cart identity and `updatedAt` rather than blindly replacing the drawer state.
- [Risk] Concurrent add actions can complete in an unexpected order. -> [Mitigation] Apply freshness ordering, keep pending fetchers in Hydrogen's optimistic pipeline, and verify rapid-add behavior in browser validation.
- [Risk] The mutation response may omit a field required by the shared cart UI. -> [Mitigation] Reuse the existing cart mutation fragment and type contract first; only alter selections after a complete field audit and code generation.
- [Risk] A stale ephemeral snapshot could leak into a later drawer open. -> [Mitigation] Scope snapshot consumption to the cart aside, clear or supersede it when root data catches up, and never use it for the cart page.
- [Risk] Showing a pending line without a price may still feel incomplete. -> [Mitigation] Keep the line and quantity immediate, use an explicit pending price state, and make the exact Shopify response the first monetary value shown.
- [Risk] New state plumbing could affect existing animation feedback. -> [Mitigation] Keep success notification and display-snapshot concerns adjacent but independently guarded, and retain failed-add and reduced-motion behavior unchanged.

## Migration Plan

1. Add the ephemeral confirmed-cart handoff and freshness reconciliation to the existing aside/cart rendering path.
2. Run TypeScript and lint checks, then exercise successful new-line adds, merged-line adds, failed adds, rapid adds, drawer controls, and the `/cart` page.
3. Measure action response and follow-up cart refresh timing before considering any mutation-fragment reduction.
4. Roll back by removing snapshot consumption while leaving the existing Hydrogen optimistic and root revalidation behavior intact.
