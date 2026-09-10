## 1. Shared Account Shell

- [x] 1.1 Refactor `app/routes/account.tsx` to render the mockup-aligned account shell with breadcrumb context, desktop navigation, mobile navigation, active-page indication, and sign-out while preserving authentication, loader privacy headers, child URLs, and `Outlet` customer context; verify `npm run typecheck` passes and the existing orders, profile, and addresses links still resolve.
- [x] 1.2 Add the shared account shell styles in `app/styles/tailwind.css`, including the desktop two-column layout, mobile collapse, visible focus states, active navigation styling, and reduced-motion behavior; verify `npm run lint` passes and browser inspection at desktop and mobile widths shows no horizontal overflow. Repository-wide lint was run; its remaining failures are confined to the pre-existing generated mockup `support.js`.

## 2. Address Data And Form Behavior

- [x] 2.1 Refine `app/routes/account.addresses.tsx` loader/action handling without changing the existing Customer Account API boundary: preserve authentication checks, supported input fields, method handling, address-ID decoding, GraphQL/user-error handling, private responses, and safe customer-facing errors; verify `npm run typecheck` passes and failed API responses do not expose credentials or raw server details.
- [x] 2.2 Replace the duplicated address form presentation with a single active add/edit form that uses only `CustomerAddressInput` fields, stable unique field IDs, semantic labels, autocomplete attributes, required-field constraints, default-address control, and preserved values/errors after validation failure; verify keyboard navigation reaches every field and form control has an accessible name in browser inspection.
- [x] 2.3 Render API-backed saved-address cards in `app/routes/account.addresses.tsx` with neutral headings, formatted address content, phone fallback handling, default status, edit entry points, and the existing six-address boundary; verify populated, empty, and six-address states match the specification without rendering Home/Office/Shipping labels or pagination controls.
- [x] 2.4 Add inline removal confirmation and mutation feedback for create, update, and delete actions, including disabled submitting controls, meaningful pending text, safe error placement, cancellation without a request, and server-confirmed revalidation before closing or removing a card; verify create, edit, default-change, delete-cancel, delete-success, and delete-failure behavior against a safe linked Customer Account environment.

## 3. Address Page Styling And Responsive Layout

- [x] 3.1 Add mockup-aligned Addresses page styles in `app/styles/tailwind.css` for the page header, action controls, cards, badges, form grid, empty state, errors, and mobile single-column reflow using existing Tailwind v4 tokens; verify browser inspection at desktop and mobile viewport sizes shows readable controls, stable card layout, and no horizontal scrolling.
- [x] 3.2 Verify the Addresses route remains accessible and visually consistent with the shared shell, including heading hierarchy, focus visibility, keyboard submission, responsive navigation, and reduced-motion behavior; verify with desktop and mobile browser snapshots plus a keyboard-only pass.

## 4. Integration Validation

- [x] 4.1 If GraphQL operations or fragments changed, run `npm run codegen` and verify generated types update cleanly; otherwise verify the existing generated Customer Account types remain sufficient for the implementation.
- [x] 4.2 Run `npm run typecheck`, `npm run lint`, and `npm run build` after implementation and resolve any regressions limited to the change; verify the production build completes successfully. Full lint remains blocked only by the pre-existing generated mockup `support.js` errors.
- [x] 4.3 Exercise authenticated account navigation and Addresses behavior in the local development app with `$playwright-cli` at desktop and mobile viewport sizes, checking layout, overflow, focus, loading/error states, imagery, console errors, and failed network requests; verify no customer tokens or private data are exposed to browser-side requests. The session showed only known baseline asset/analytics errors and no customer credentials or tokens in page content or requests.
