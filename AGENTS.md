# Singhar By Sidra — Agent Guide

This file is the operating guide for coding agents working in this repository. Treat the repository and its configuration as the source of truth: inspect neighboring code before changing it, and update this guide when a material architectural or workflow fact changes.

## Project Overview

Singhar By Sidra is a production Shopify headless storefront built from the Shopify Hydrogen skeleton template. It is a TypeScript React Router application intended to run on Shopify Oxygen and use the real linked Shopify store. It is not a Mock.shop storefront.

The supplied business context identifies Pakistan as the initial primary market. The current code is not yet configured for that market: `app/lib/context.ts` hard-codes `i18n: {language: 'EN', country: 'US'}`, and `app/routes/sitemap.$type.$page[.xml].tsx` contains the template locale list `EN-US`, `EN-CA`, and `FR-CA`. Treat those as current implementation details to verify or deliberately change, not as proof of active markets. Do not introduce multi-market URL routing or market-selection complexity unless it is requested or already implemented.

The app currently has storefront browsing, collections, products and variants, search, blogs, pages, policies, cart and checkout handoff, Shopify Customer Account pages, analytics, robots.txt, and sitemap routes. The home route still contains the generated `MockShopNotice` fallback when `PUBLIC_STORE_DOMAIN` is absent; this is a configuration diagnostic only, not a production data source.

## Technology Stack

Versions below are verified from `package.json` and `package-lock.json`; keep them aligned with the lockfile.

- Node.js `^22 || ^24`; npm is the package manager.
- Hydrogen `@shopify/hydrogen` `2026.4.5`.
- React and React DOM `^18.3.1`.
- React Router and React Router DOM `7.16.0`; routing imports in application code come from `react-router`.
- TypeScript `^5.9.2` with strict mode enabled.
- Vite `^8.0.1`, `@react-router/dev` and `@react-router/fs-routes` `7.16.0`.
- Tailwind CSS `^4.1.6` with `@tailwindcss/vite` `^4.1.6`; this is a Tailwind v4 CSS-first setup.
- Shopify CLI `3.93.2`, Hydrogen codegen `0.3.3`, and Mini Oxygen `4.2.2`.
- GraphQL `^16.10.0`, GraphQL Code Generator CLI `5.0.2`, and `graphql-config` `5.0.3`.
- ESLint 9 with React, React Hooks, JSX a11y, TypeScript, import, and Jest plugins. Jest is configured as a lint plugin only; no Jest test setup is present.
- Prettier 3 using `@shopify/prettier-config`; there is no `format` npm script.
- `isbot` is used for bot-aware server streaming.

Hydrogen is the React Router-based architecture in this version. Do not apply Remix-era package imports, Remix route APIs, or Hydrogen developer-preview instructions to this project.

For Shopify API or platform work, use the available Shopify Hydrogen/Shopify AI Toolkit guidance and current Shopify documentation before writing new operations or using unfamiliar Hydrogen APIs. Validate GraphQL changes with this repository’s code generation workflow.

## Available Shopify Skills

This agent environment provides two Shopify skills that future agents may invoke when a task needs specialized guidance:

- `$shopify-hydrogen` — use for Hydrogen/Oxygen storefront implementation, current Hydrogen APIs and cookbook patterns, cart, caching, analytics, markets/localization, performance, and deployment guidance. Its local instructions are at `/home/hk/.agents/skills/shopify-hydrogen/SKILL.md`.
- `$shopify-customer` — use for Shopify Customer Account API work, including authenticated customer profile, orders, addresses, payment methods, privacy, and customer-context queries or mutations. Its local instructions are at `/home/hk/.agents/skills/shopify-customer/SKILL.md`.

Invoke the relevant skill before implementing unfamiliar Hydrogen or Customer Account behavior, and follow its current documentation-search and validation workflow. These skills supplement this repository guide; they do not authorize architecture migrations, secret handling, or changes outside the requested scope.

## Available UI/UX Validation Skill

`$playwright-cli` is available at `/home/hk/.agents/skills/playwright-cli/SKILL.md` for browser automation and frontend validation.

Use `$playwright-cli` for every meaningful UI/UX, design, or frontend change when the application can be run locally. Start the repository’s actual development command, open the changed route, and validate the result in both desktop and mobile-sized viewports. Check layout, responsive behavior, overflow, navigation, interactive states, keyboard/focus behavior, loading and error states, imagery, console errors, and failed network requests. Use snapshots and targeted interactions as the normal evidence; use screenshots when they materially help inspect a visual result or when the user requests them.

If local runtime configuration, Shopify access, or another environment issue prevents browser validation, report that limitation explicitly and do not claim the UI was verified. The mockup prototype remains a design reference; follow `singhar-by-sidra-mockup-design/README.md` before inspecting or rendering it.

## Repository Structure

Only add code to an existing area after reading its local patterns.

- `app/routes/` — React Router file-system routes. Route filenames use React Router flat-route conventions and are assembled by `app/routes.ts`.
- `app/components/` — shared UI and commerce components: layout, header/footer, asides, search, product cards/forms, cart, and pagination.
- `app/graphql/customer-account/` — Customer Account API queries, fragments, and mutations. This directory is a separate GraphQL project in `.graphqlrc.ts`.
- `app/lib/` — shared server/client helpers: Hydrogen context and session setup, shared Storefront fragments, search types/URL tracking, variant URL handling, order filters, and localized-handle redirects.
- `app/styles/tailwind.css` — the single Tailwind v4 stylesheet entry point. It currently contains Tailwind import/preflight only; the starter visual layer was intentionally cleared for the storefront mockup.
- `app/assets/` — imported assets such as the favicon.
- `app/root.tsx` — root loader, global links, document layout, analytics provider, shared page layout, and root error boundary.
- `app/entry.client.tsx` — browser hydration, Strict Mode, CSP nonce propagation, and the Google web-cache guard.
- `app/entry.server.tsx` — Oxygen-compatible streaming SSR, bot readiness handling, CSP generation, and response headers.
- `server.ts` — Oxygen worker fetch handler, Hydrogen request handler, session cookie commit, 404 storefront redirects, and top-level 500 handling.
- `app/routes.ts` — combines `hydrogenRoutes` with `flatRoutes`; manual route entries may be added here only when file-based routing is insufficient.
- `react-router.config.ts` — official `hydrogenPreset()` configuration.
- `vite.config.ts` — Hydrogen, Mini Oxygen, React Router, Tailwind v4, the `~` alias, SSR dependency handling, and build settings.
- `storefrontapi.generated.d.ts` — generated Storefront API operation and fragment types.
- `customer-accountapi.generated.d.ts` — generated Customer Account API operation and fragment types.
- `.react-router/` — generated React Router route types; ignored by Git and regenerated by `react-router typegen`.
- `public/` — public static assets; currently only `.gitkeep` is tracked.
- `.shopify/` — ignored local Shopify project linkage state. Never copy its store identifiers or credentials into source or documentation.

There are no committed `.github/` workflows, test configuration files, Shopify TOML files, or `.env.example` file. `CHANGELOG.md` is historical project/template documentation, not a runtime configuration source.

## Design Mockup Reference

The visual source of truth is the handoff bundle at `singhar-by-sidra-mockup-design/`. Before implementing or materially changing any UI/UX, read `singhar-by-sidra-mockup-design/README.md` and follow its instructions.

When a task touches the storefront’s visual design:

1. Find the primary design file under `singhar-by-sidra-mockup-design/project/`.
2. Read that design file from top to bottom.
3. Follow every referenced import, shared component, stylesheet, script, and asset needed to understand the design.
4. Recreate the visual output in this Hydrogen/React/Tailwind codebase; do not copy prototype HTML structure unless it fits the production architecture.
5. Treat the mockup files as design references, not production runtime code. Do not import prototype files into `app/`.
6. If the design scope or intended behavior is ambiguous, ask for confirmation before implementing.

The mockup README specifically says not to render the prototype or take screenshots unless the user requests it. Prefer reading the source files directly for dimensions, colors, layout rules, and interaction intent.

## Architecture Principles

- Preserve the existing Hydrogen + React Router + Oxygen architecture.
- Keep focused tasks focused. Prefer the smallest coherent change over broad cleanup, migrations, or rewrites.
- Reuse Hydrogen primitives and existing components before adding parallel commerce or UI abstractions.
- Keep Storefront API and Customer Account API calls in route loaders/actions or established Hydrogen context paths. Do not create ad hoc browser fetches to Shopify for data that belongs on the server.
- Keep the server/client boundary explicit. Environment access, customer operations, cart mutations, sessions, and private data stay server-side; browser components consume loader data and use React Router forms/fetchers.
- Preserve streamed/deferred loading and root revalidation behavior unless the task requires a deliberate change and the performance/privacy consequences are checked.
- Do not introduce a second styling system, router convention, GraphQL client, cart store, metadata system, or session system without an explicit architectural request.

## Shopify Hydrogen Rules

Use `@shopify/hydrogen` for the installed Hydrogen APIs and primitives. Important existing primitives include `Image`, `Money`, `Pagination`, `CartForm`, `Analytics`, `useOptimisticCart`, `useOptimisticVariant`, `getProductOptions`, `getSelectedProductOptions`, `getPaginationVariables`, `getShopAnalytics`, `getSitemap`, and `getSitemapIndex`.

Use Shopify’s Storefront API for catalog, collection, product, search, blog, page, policy, and cart data. Use the Customer Account API client exposed as `context.customerAccount` for authenticated customer data and mutations. Do not recreate Shopify checkout, login, customer tokens, product variant resolution, or pagination in application code when a supported Hydrogen primitive already covers the need.

The current implementation includes:

- Product option/variant selection through Hydrogen variant helpers and `ProductForm`.
- Regular and predictive search through `/search`, `SearchForm`, `SearchFormPredictive`, `Pagination`, and Storefront API queries.
- Connection pagination through `getPaginationVariables` in loaders and `Pagination` through `PaginatedResourceSection` or search result components.
- Shopify image and money rendering through Hydrogen components.
- Shopify analytics at the root, plus product, collection, search, and cart-view events in the relevant routes/components.
- A Hydrogen `Analytics.Provider` with `withPrivacyBanner: false`. Treat consent/privacy behavior as production-sensitive; do not silently change it.
- Shopify checkout handoff through the cart’s `checkoutUrl`. Accelerated checkout and Shop Pay are not currently implemented; inspect installed Hydrogen support and the requested UX before adding them.

When adding a feature, inspect the relevant Hydrogen cookbook/current docs and neighboring implementation first. Keep the Storefront API version compatible with the installed Hydrogen version and generated schema. Do not use Mock.shop in production paths.

## GraphQL / Storefront API

### Locations and conventions

- Most Storefront operations are colocated with their route in `app/routes/*.tsx`.
- Shared cart and navigation operations/fragments are in `app/lib/fragments.ts` (`CART_QUERY_FRAGMENT`, `HEADER_QUERY`, `FOOTER_QUERY`).
- Customer Account operations are in `app/graphql/customer-account/*.ts`.
- Operations are TypeScript `#graphql` template literals, generally exported as `const` values and composed with fragments.
- Operation and fragment names are PascalCase and descriptive (`Product`, `ProductVariant`, `Collection`, `RegularSearch`, `PredictiveSearch`, `CustomerOrders`, etc.). Follow the nearby name rather than inventing a different convention.
- Storefront operations generally include `@inContext(country: $country, language: $language)` when the resource is localized. Customer operations use their own customer-account schema and commonly include `@inContext(language: $language)`.
- `app/graphql/customer-account/` is excluded from the default Storefront project and included by the `customer` project in `.graphqlrc.ts`.

### Code generation

`.graphqlrc.ts` obtains the Storefront and Customer Account schemas from `@shopify/hydrogen-codegen`. Generated types are written to `storefrontapi.generated.d.ts` and `customer-accountapi.generated.d.ts`; React Router route types are generated under `.react-router/`.

Request only the fields the feature needs, keep fragments appropriately scoped, and type variables from the generated operation types where useful. Preserve nullable fields as nullable. Never manually edit either generated API declaration file or generated React Router types. After changing an operation or fragment, run `npm run codegen` and then `npm run typecheck`; `npm run build` and `npm run dev` also invoke Hydrogen codegen.

Check the generated result and the actual API error/user-error shape. Do not silently discard GraphQL `errors`, customer `userErrors`, cart errors, or warnings. Avoid oversized root queries and avoid duplicating a shared fragment when the existing one supplies the required fields.

## Routing

`app/routes.ts` wraps React Router `flatRoutes()` with Hydrogen’s `hydrogenRoutes()`. The route tree currently includes:

- `/`, `/search`, `/cart`, `/cart/:lines`, `/discount/:code`, and the catch-all `*` route.
- `/products/:handle`, `/collections`, `/collections/all`, `/collections/:handle`.
- `/blogs`, `/blogs/:blogHandle`, `/blogs/:blogHandle/:articleHandle`.
- `/pages/:handle` and `/policies`, `/policies/:handle`.
- `/account` with nested `/orders`, `/orders/:id`, `/addresses`, `/profile`, login, authorize, logout, and an unauthenticated wildcard.
- `/robots.txt`, `/sitemap.xml`, and `/sitemap/:type/:page.xml` resource routes.

Use the filename convention already present: `$handle` for dynamic params, `_index` for index routes, a trailing `_` for pathless/non-nesting route names such as `account_.login`, and `[robots.txt]`/`[sitemap.xml]` for literal resource filenames. Inspect the generated route tree and neighboring routes before adding a route.

Loaders fetch server data and return typed loader data. Actions handle mutations and redirects. Existing routes use `Response`/`redirect` for 404s and redirects, route `meta` functions for metadata, and route `ErrorBoundary` behavior inherited from the root unless specialized. Use React Router imports from `react-router`; do not import application routing APIs from Remix packages. Avoid `react-router-dom` imports in application code.

Resource/API-like routes should return a `Response` where appropriate, as the robots and sitemap routes do. Keep external redirects constrained to approved Shopify URLs or same-origin paths; preserve the open-redirect guard in `app/routes/discount.$code.tsx`.

## Data Loading and Streaming

The established loader shape is:

1. Start non-critical work in `loadDeferredData` without awaiting it.
2. Await above-the-fold data in `loadCriticalData`.
3. Return both values so React Router/Hydrogen can stream promises through `Suspense`/`Await`.

`app/root.tsx` is the clearest example: the header is critical; footer, cart, and login state are deferred. The home route defers recommended products. Many catalog/content routes retain the same helper shape but currently have no deferred request. Do not add artificial deferral to data required for the first render.

Use `Promise.all` for independent Shopify or Customer Account requests. Avoid request waterfalls. Use `getPaginationVariables(request, {pageBy: ...})` for connection pagination and preserve the connection fields required by Hydrogen `Pagination` (`pageInfo` and cursors). Keep query payloads bounded and select only required fields.

Prefer server loaders for catalog, SEO, account, and initial page data. Use client `useFetcher`/React Router forms for interactions that already follow the predictive search, cart, or account patterns. Handle empty, unavailable, sold-out, loading, and failed states explicitly.

## Caching

The current caching policy is deliberately mixed:

- `app/root.tsx` uses `storefront.CacheLong()` for the shared header and deferred footer menu queries.
- Most route Storefront queries currently rely on the client default and do not specify a cache strategy.
- Account layout data returns `Cache-Control: no-cache, no-store, must-revalidate` because it contains customer data.
- robots and sitemap responses set a one-day `max-age`.
- Cart mutation responses preserve action headers and cart-cookie headers; do not cache them as public content.

Use Hydrogen’s installed `CacheLong`, `CacheShort`, `CacheNone`, or `CacheCustom` only after classifying the data. Public catalog/menu data can be cached; customer-specific, cart-specific, token-bearing, or mutation responses must not be shared. A subrequest cache policy does not replace a response-level private/no-store header for personalized HTML. Do not add public caching to account routes or any response containing customer information.

## Cart / Checkout

The cart is owned by Hydrogen’s context in `app/lib/context.ts`, with `CART_QUERY_FRAGMENT` supplying the typed cart shape. Hydrogen manages the cart ID through the cart handler and cookie. `app/routes/cart.tsx` is the single cart action endpoint and dispatches `CartForm.ACTIONS` for:

- line add, update, and remove;
- discount-code update;
- gift-card add and remove;
- buyer-identity update.

Shared UI uses `CartForm` pointed at `/cart`; `CartMain` uses `useOptimisticCart`; line updates use keyed fetchers to prevent rapid conflicting updates. Preserve the cart fragment fields needed by analytics, optimistic rendering, line components, product links, totals, discounts, and checkout. When a cart mutation creates/updates a cart, preserve `cart.setCartId(...)`, action headers, and any intentional 303 redirect behavior.

The checkout link is the Shopify-provided `cart.checkoutUrl`. `/cart/:lines` creates a cart from variant IDs and redirects to Shopify checkout; `/discount/:code` applies a discount and redirects to a same-origin path. Do not bypass Shopify checkout, store a second client cart, expose cart/customer tokens, or replace Hydrogen cart state with a custom global store.

## Customer Accounts

Customer Account API support is present and production-sensitive. The flow is:

- `account_.login.tsx` starts OAuth through `context.customerAccount.login()`.
- `account_.authorize.tsx` completes the callback with `authorize()`.
- `account_.logout.tsx` performs logout in its action and redirects GET requests home.
- `account.tsx` queries the authenticated customer and disables caching.
- `account.profile.tsx` updates first/last name.
- `account.orders._index.tsx` and `account.orders.$id.tsx` query orders with pagination/filtering.
- `account.addresses.tsx` creates, updates, and deletes addresses with POST/PUT/DELETE actions.
- `account.$.tsx` handles unauthenticated account wildcards through `handleAuthStatus()`.

Keep account loaders and mutations behind `customerAccount.handleAuthStatus()` or the existing `isLoggedIn()` check as appropriate. Preserve OAuth state/session behavior, never put access tokens in loader data or browser code, and keep account responses private/no-store. Validate and allow-list form fields before sending them to Customer Account API. Preserve API and `userErrors` handling.

## Shopify Markets / Localization

The API query pattern already passes country/language variables in many Storefront operations, and `app/lib/variants.ts` recognizes two-segment locale URL prefixes when constructing product variant URLs. That is future-compatible groundwork, not a complete markets implementation.

Current runtime locale defaults are `EN`/`US`; there is no current market selector, country negotiation, locale middleware, or systematic market URL prefixing. Pakistan is the current launch assumption supplied for this project. Keep changes single-market by default. If international markets are requested later, design URL prefixes, `@inContext`, canonical URLs, menus, redirects, cart buyer identity, sitemap locales, and tests as one coherent change; do not add partial locale behavior to an unrelated feature.

## Environment Variables and Secrets

The runtime receives an Oxygen `Env` object. `env.d.ts` supplies Vite, React Router, Oxygen worker, Hydrogen React Router, and TypeScript reset references; it does not manually declare individual application variables. Hydrogen’s installed runtime expects the following names:

Public/runtime configuration:

- `PUBLIC_STORE_DOMAIN` — linked storefront domain, used by context, root layout, menu URL normalization, and CSP.
- `PUBLIC_STOREFRONT_API_TOKEN` — public Storefront API token; passed to Hydrogen privacy/analytics configuration as intended by the skeleton.
- `PUBLIC_STOREFRONT_ID` — storefront/subchannel identifier used by `getShopAnalytics`.
- `PUBLIC_CHECKOUT_DOMAIN` — checkout domain used by analytics/privacy and CSP.
- `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` — Customer Account API client identifier.
- `PUBLIC_CUSTOMER_ACCOUNT_API_URL` — Customer Account API URL expected by the Hydrogen runtime.

Server-sensitive configuration:

- `PRIVATE_STOREFRONT_API_TOKEN` — private Storefront API token consumed by Hydrogen server context.
- `SESSION_SECRET` — required by `AppSession.init`; absence throws during context creation.
- `SHOP_ID` — used by the Customer Account API client.

Never commit or print secret values. Never put private tokens, session secrets, OAuth tokens, or real store identifiers in `AGENTS.md`, source, logs, screenshots, or test fixtures. `.env` and `.shopify` are ignored; this repository has no committed `.env.example`. When adding a legitimate variable, update the actual deployment/local environment documentation and typing strategy rather than embedding a value. Keep server-only variables out of browser props and client bundles.

## Security

- Treat URL parameters, form fields, query strings, search terms, discount codes, and account input as untrusted.
- Validate and allow-list action input before calling Shopify APIs. Preserve the existing redirect validation in `discount.$code.tsx`.
- Preserve the nonce and CSP flow in `entry.server.tsx`, `entry.client.tsx`, and `root.tsx`. Do not weaken CSP or security headers for convenience.
- Treat Shopify `body`/`bodyHtml`/`descriptionHtml` as trusted Shopify-managed HTML only. Do not extend `dangerouslySetInnerHTML` to arbitrary user input without an appropriate sanitization design.
- Do not expose account access tokens or private Storefront credentials.
- Keep personalized account data private and avoid shared caching.
- Use same-origin or explicitly approved redirects; never accept arbitrary external redirect targets.

## SEO

The current SEO system is route-level React Router `meta` functions. Product routes add a relative canonical link; most content routes provide title metadata based on loaded Shopify data or a template title. There is no separate SEO package, JSON-LD/structured-data system, or global canonical builder currently present. Do not introduce a duplicate metadata system; extend the route metadata pattern or deliberately adopt a Hydrogen-supported helper as one coherent change.

`robots.txt` is generated by `app/routes/[robots.txt].tsx` and disallows account, cart, search, policy, and selected filtered/sorted URLs. `/sitemap.xml` uses `getSitemapIndex`; child sitemap routes use `getSitemap` and currently set one-day cache headers. Keep sitemap URLs, locale lists, canonical URLs, and market routing consistent whenever localization changes.

For new indexable product, collection, blog, article, page, or policy routes, provide accurate title/description/canonical behavior from the same loader data, preserve 404 behavior, and verify social/structured metadata requirements before adding them. Do not claim SEO support exists merely because a Shopify `seo` field is selected; most current routes do not yet map it into metadata.

## TypeScript

- Preserve `strict: true`, `isolatedModules`, `verbatimModuleSyntax`, and the `~/*` path alias.
- Prefer generated Storefront and Customer Account types and route-local `./+types/...` types.
- Model Shopify nullability accurately. Do not use unsafe casts to suppress missing or nullable API fields.
- Avoid unjustified `any`, blanket `@ts-ignore`, and non-null assertions; if an existing file has one, do not spread the pattern.
- Type component props and action/loader responses. Use inference when it makes the code clearer and avoids redundant maintained types.
- Run `npm run typecheck` after changing routes, loaders/actions, GraphQL, context, or generated types. This regenerates React Router types before running `tsc --noEmit`.

## React

Use functional components and hooks according to the installed React 18 patterns. Keep components focused and preserve existing composition (`PageLayout` → header/footer/asides; `CartMain` → line items/summary; search form → result components). Prefer server-loaded data and forms/fetchers over adding stateful client fetches.

Avoid effects for derived data, unnecessary client state, unstable list keys, hydration-dependent browser reads, and premature memoization. When an effect is needed, clean it up as existing keyboard/listener effects do. Preserve semantic HTML, stable keys, loading/empty/error states, and the existing optimistic cart/variant behavior.

## Tailwind CSS v4 / Styling

Tailwind v4 is wired through `tailwindcss()` in `vite.config.ts` and the CSS-first `@import 'tailwindcss'` in `app/styles/tailwind.css`. There is no legacy `tailwind.config.js`, PostCSS setup, or Tailwind v3 directive configuration.

The current visual system is an intentional clean slate. `app/styles/tailwind.css` is the only stylesheet loaded by the root and currently provides Tailwind v4 import/preflight without Hydrogen starter component styling or project-specific design tokens. Establish the mockup’s tokens and component patterns deliberately as the design is implemented.

Use Tailwind utility classes in TSX for new UI, with mobile-first responsive behavior based on the approved mockup. Add design tokens to the Tailwind v4 theme when the mockup establishes them. Keep genuinely global rules in `app/styles/tailwind.css` under Tailwind layers only when utilities cannot express the behavior cleanly; do not recreate the removed starter CSS or create another stylesheet. Do not add another CSS framework, downgrade Tailwind, or introduce Tailwind v3 configuration patterns. Avoid unnecessary inline styles.

## UI / UX and Accessibility

Before changing UI, inspect the component and the approved mockup. The starter visual system has been cleared, so do not infer a design system from old semantic class names. Establish layout rhythm, typography, color, responsive behavior, drawers, grids, and states from the mockup in Tailwind. Verify desktop and mobile viewports and do not redesign unrelated screens.

Use semantic HTML first: headings in order, `nav`, `main`, `section`, lists, labels, buttons, and links for their actual purposes. Maintain keyboard access, visible focus, Escape/outside-close behavior for asides, dialog labeling, form labels/autocomplete, disabled/loading states, and useful `aria-*` only where semantics do not suffice. Provide meaningful alt text, preserve contrast, and respect reduced-motion preferences when adding motion. Do not ship a new interactive control without empty, loading, error, unavailable, sold-out, and disabled behavior where applicable.

## Images / Media

Prefer Hydrogen `Image` with Shopify image data. Preserve explicit aspect ratios, dimensions/sizes, and layout stability. Use eager loading only for above-the-fold/LCP candidates; current collection/product grids eagerly load the first visible items and lazy-load cart/non-critical images. Keep responsive `sizes` accurate. Preserve alt text from Shopify with a meaningful product/title fallback. Do not add a new image transformation library without a measured need and Oxygen-compatible review.

## Performance

Storefront performance is correctness for this production storefront. Keep GraphQL selections narrow, parallelize independent requests, preserve critical/deferred streaming, and avoid client-side data fetching for server-owned content. Minimize browser JavaScript and dependencies, protect hydration consistency, use stable keys, avoid needless rerenders/effects, and optimize images without causing layout shifts.

Preserve `root.shouldRevalidate`, which intentionally avoids re-fetching root data on ordinary navigations and revalidates mutations/manual revalidation. If changing it, verify cart/account/header freshness and navigation cost. Preserve `assetsInlineLimit: 0` because the Vite comment documents its role in strict CSP. Keep the server handler and Mini Oxygen configuration compatible with Oxygen’s edge runtime.

## Error Handling

Use the existing patterns: throw a 404 `Response` for missing Shopify resources, use `redirect` for valid route transitions, return structured `data(..., {status})` for expected form/action failures, and preserve GraphQL/cart/customer errors and warnings for user-visible handling. The root `ErrorBoundary` renders route errors; `server.ts` logs unexpected server failures and returns a generic 500 response.

Do not silently swallow meaningful errors. Deferred root footer/recommendation failures are intentionally logged and converted to `null` so non-critical content does not take down the page; copy that tolerance only for genuinely non-critical data. Never render raw exception details to customers in a new production error surface.

## Code Style and Dependency Policy

Follow the existing style: TypeScript/TSX, single quotes, semicolons, trailing commas, named imports, `~` for app imports, PascalCase component/type names, camelCase functions/variables, and route filenames following flat-route conventions. Let the repository’s Prettier and ESLint configuration decide formatting and lint rules; do not make personal style changes unrelated to the task.

Use npm and keep `package-lock.json` synchronized. Check existing dependencies and Hydrogen primitives first. Add a dependency only when it materially solves the requested problem and is compatible with Hydrogen 2026.4.5, React Router 7.16.0, Vite 8, Tailwind v4, and Oxygen. Do not upgrade packages, switch package managers, or edit lockfile entries by hand for unrelated work.

## Generated Files

The following are generated and must be regenerated, not manually edited:

- `storefrontapi.generated.d.ts`
- `customer-accountapi.generated.d.ts`
- `.react-router/` route/typegen output

Use `npm run codegen` after GraphQL changes. Use `npm run typecheck` when route type generation is also needed. ESLint intentionally ignores generated API declarations, generated React Router output, build/dist output, and other generated GraphQL files.

## Commands

These are the actual npm scripts in `package.json`:

- Install dependencies: `npm install`.
- Start local Hydrogen/Mini Oxygen development with code generation: `npm run dev`.
- Build for the Hydrogen/Oxygen production bundle with code generation: `npm run build`.
- Preview the built bundle locally: `npm run preview`.
- Run ESLint: `npm run lint`.
- Generate Storefront/Customer Account types and React Router types: `npm run codegen`.
- Generate React Router types and run TypeScript without emitting: `npm run typecheck`.

There are no npm scripts for tests, formatting, or deployment. The package config does provide Prettier and the repository context says the Hydrogen CLI `h2` alias is enabled; the checked-in scripts use `shopify hydrogen ...` and are the authoritative local workflows. If using `h2` or Shopify CLI directly, inspect the installed CLI help and current Oxygen workflow first rather than inventing a deployment command. Do not treat `npm run preview` as a deployment.

## Testing and Validation

No test runner, test files, Playwright config, or CI workflow is committed. For every meaningful change, run the narrowest relevant validation and report exactly what ran:

- GraphQL changes: `npm run codegen`, `npm run typecheck`, and relevant route checks.
- TypeScript/route/context changes: `npm run typecheck` and `npm run lint`.
- Build/config/server changes: `npm run build`, then `npm run preview` when practical.
- UI changes: run `npm run dev` and use `$playwright-cli` to inspect the changed route in desktop and mobile-sized viewports. Check layout, overflow, navigation, focus/hover states, loading states, imagery, console errors, and failed network requests. If the browser check cannot run, report the exact blocker.
- Account/cart changes: exercise login/logout or cart add/update/remove/checkout flows against a safe linked environment; do not use real secrets in reports.

Never claim a command, browser check, or test passed unless it actually ran successfully. If a validation step is blocked by missing environment, Shopify access, or an unrelated baseline failure, report that exact limitation.

## Agent Workflow

1. Read this file completely and inspect `git status`.
2. Locate the target route/component/configuration and read it end-to-end.
3. Read its imports, related fragments, shared components, styles, and at least one neighboring implementation.
4. Check current Hydrogen/Shopify guidance when the task touches API fields, cart, accounts, markets, analytics, caching, SEO, or deployment.
5. Form a focused implementation plan and preserve existing abstractions.
6. Make the smallest coherent change that fully solves the request.
7. Run proportional typecheck, lint, codegen, build, and browser validation as described above.
8. Review `git diff` and re-check for secrets, hydration issues, cache leaks, accessibility regressions, and unrelated edits.
9. Fix regressions introduced by the change.
10. Report changed files, behavior, validation commands/results, and any remaining limitation.

Before editing, do not guess about code you have not inspected. When working on a route, component, API, or GraphQL operation, read the target, its dependencies, related fragments, and similar features first.

## Git and Scope Rules

- Inspect `git status` before modifying files and preserve unrelated user changes.
- Keep the diff focused and review it before handoff.
- Do not commit unless explicitly requested.
- Do not force-push, rewrite history, reset, revert, or delete user work.
- Do not rename files broadly or perform unrelated cleanup to make the tree look different.
- Do not migrate Hydrogen, React Router, styling, package manager, or hosting architecture without explicit instruction.
- Update relevant documentation, including this file, when behavior, architecture, commands, or environment setup materially changes.

## Prohibited Actions

Agents must not:

- expose secrets, access tokens, session values, customer data, or private store configuration;
- manually edit generated API/type files;
- change npm to another package manager or upgrade unrelated dependencies;
- migrate away from the installed Hydrogen React Router/Oxygen architecture without a request;
- use Mock.shop or a mock storefront in production paths;
- bypass Shopify checkout or create parallel cart state;
- assume Storefront API fields, enum values, locale behavior, or Hydrogen APIs without checking the installed schema/docs and running codegen;
- weaken TypeScript or disable lint rules globally to hide a problem;
- add another CSS framework or legacy Tailwind configuration;
- add dependencies casually;
- weaken CSP/security headers, expose account tokens, or make personalized responses public-cacheable;
- delete, reset, revert, or overwrite unrelated user work;
- make unrelated refactors or speculative abstractions;
- claim verification that was not performed.

## Task Completion Standard

A task is complete only when the requested behavior is implemented, the implementation follows the repository’s Hydrogen/React Router/TypeScript/styling conventions, generated artifacts are up to date when relevant, proportional validation succeeds, no obvious regression was introduced, the diff is scoped, and the final report names the changed files and actual validation results.
