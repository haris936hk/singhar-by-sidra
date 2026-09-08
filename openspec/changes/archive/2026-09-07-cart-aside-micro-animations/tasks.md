## 1. Cart-add feedback coordination

- [x] 1.1 Add a typed, one-shot cart-add feedback signal to the existing aside coordination layer and verify the provider and consumers pass `npm run typecheck`.
- [x] 1.2 Update the add-to-cart flow to emit feedback only after a usable cart result without blocking errors, while preserving immediate drawer opening; verify failed submissions do not announce success and `npm run lint` passes.
- [x] 1.3 Track the submitted add against the resulting optimistic cart so new lines and increased existing quantities receive different feedback, and coalesce repeated additions; verify each case with rapid successive add actions.

## 2. Cart drawer confirmation UI

- [x] 2.1 Add a reserved status slot beneath the cart drawer heading with the exact text `Added to your bag`, polite status semantics, and atomic announcements; verify the text is visible and announced after a successful add without changing header geometry.
- [x] 2.2 Add one-shot confirmation, line, and count state markers that do not replay when the drawer opens with existing items; verify opening the drawer manually leaves existing lines stable.

## 3. Scoped motion and accessibility

- [x] 3.1 Add cart-aside-only transform and opacity motion using the existing motion tokens for new-line entrance, quantity feedback, count pulse, and confirmation enter/exit; verify each transition remains below 300ms and no layout properties animate.
- [x] 3.2 Add cart-aside reduced-motion rules that make confirmation and state changes immediate while preserving visibility and interaction; verify with `prefers-reduced-motion: reduce` that no non-essential transform, opacity, or pulse remains.
- [x] 3.3 Confirm shared cart components do not inherit the new behavior on `/cart`; verify the cart page has no `Added to your bag` status slot or cart-aside success animation.

## 4. UI validation

- [x] 4.1 Run the repository checks with `npm run typecheck` and `npm run lint`, resolving any type, accessibility, or styling issues introduced by the change.
- [x] 4.2 Start the repository's actual development command and use Playwright CLI to validate successful adds, existing-line quantity increases, failed adds, rapid adds, drawer dismissal, keyboard focus, and checkout/navigation at mobile and desktop drawer sizes.
- [x] 4.3 Use Playwright CLI to verify the reduced-motion experience and inspect console errors, failed network requests, overflow, and layout stability in both the cart drawer and `/cart` page.
