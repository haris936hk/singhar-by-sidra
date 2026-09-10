## 1. Dependency and Runtime Setup

- [x] 1.1 Add the compatible `@bildit-platform/hydrogen` dependency and synchronize `package-lock.json`; verify `npm ls @bildit-platform/hydrogen` resolves without peer-dependency errors.
- [x] 1.2 Register BILDIT host React globals and non-React CMS dependencies before browser hydration; verify the client entry contains no manual CMS script injection and `npm run typecheck` passes.
- [x] 1.3 Load server-side BILDIT banners from the root request using `BILDIT_API_URL` and `BILDIT_API_KEY` from runtime environment bindings; verify the API key is absent from browser markup, loader data, and client requests.

## 2. Provider and Navigation Integration

- [x] 2.1 Wrap the existing analytics, page layout, and route outlet with `BilditRoot` while preserving the current root data shape; verify the application typechecks and existing Shopify analytics provider remains mounted.
- [x] 2.2 Update root revalidation so transitions entering, leaving, or changing the `/` homepage refresh BILDIT data while unrelated route transitions retain the existing optimization; verify navigation from a product or collection route to `/` requests the homepage banner set.

## 3. Editor, CSP, and Bundling

- [x] 3.1 Merge `bilditCspDirectives` into Hydrogen's generated CSP and apply the BILDIT iframe-embedding helper without removing Shopify sources; verify the response includes BILDIT CDN access and permits the Visual Editor iframe.
- [x] 3.2 Add the documented Tailwind browser runtime with Hydrogen's nonce for draft Visual Editor content and allow only its required CDN sources in CSP; verify normal storefront rendering still works outside the editor.
- [x] 3.3 Configure Vite SSR bundling for the BILDIT adapter, rendering core, engine, and required dependency packages; verify `npm run build` completes successfully.

## 4. Homepage Slots and Fallbacks

- [x] 4.1 Place a `home-hero` slot around the existing homepage hero and a `home-promo` slot around the existing editorial banner; verify the current hero and promotional banner render when BILDIT returns no content.
- [x] 4.2 Preserve the remaining homepage sections and Shopify product links outside the two slots; verify the homepage layout, product carousel links, and commerce interactions are unchanged when slots are empty.
- [x] 4.3 Confirm the slot contracts and fallback behavior against the BILDIT requirements; verify content assigned to a different location or slot does not replace either fallback.

## 5. Local and Production Validation

- [x] 5.1 Run `npm run codegen`, `npm run typecheck`, and `npm run lint`; verify all generated artifacts and application checks complete without new errors.
- [x] 5.2 Run `npm run dev` with the configured local `.env`, then inspect the homepage at desktop and mobile viewports with the Playwright CLI; verify no horizontal overflow, hydration errors, failed BILDIT requests, or console errors occur.
- [x] 5.3 Create one published BILDIT item at location `/` using `home-hero`, then test normal rendering and a preview-date URL; verify the active and previewed content replace only the intended fallback.
- [x] 5.4 Open the homepage through BILDIT's Visual Editor and use its Verify flow; verify the editor bridge loads and the `home-hero` and `home-promo` placements are editable without a manually hosted CMS script.
- [x] 5.5 Add `BILDIT_API_URL` and secret `BILDIT_API_KEY` to the intended Oxygen environment, redeploy, and test the production homepage; verify the production banner response and Shopify catalog, cart, account, checkout, analytics, and SEO behavior remain functional.
