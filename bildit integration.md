# BILDIT Integration

## Document Purpose

This document records the complete BILDIT integration into the Singhar by Sidra Shopify Hydrogen storefront. It covers the investigation of the BILDIT Hydrogen reference implementation, the architectural decisions, the application changes, dashboard and deployment configuration, local and production validation, the complete BILDIT CLI setup and website-scoped template workflow, problems encountered, mitigations, known limitations, and the final state of the repository.

Secret values, access tokens, private URLs, and full store or organization identifiers are intentionally omitted. The exact runtime values remain in ignored local configuration or deployment secrets and must never be copied into documentation, source code, logs, screenshots, or browser data.

The work was implemented and validated during the September 10-11, 2026 session. The implementation was committed in the repository in the BILDIT integration commits and the OpenSpec change was later archived.

This record covers the archived homepage integration work and the follow-up BILDIT template-authoring setup. `@bildit-platform/bild-cli` was added as a project dependency after the runtime integration was archived, and the same CLI was installed globally for the authenticated website workflow. It is authoring and CMS-management tooling, not a runtime storefront dependency, and is documented separately from the Hydrogen adapter integration.

## Starting Point

The storefront was already a Shopify Hydrogen application running on Shopify Oxygen and using the React Router architecture supplied by the installed Hydrogen version.

The relevant baseline was:

- Hydrogen `2026.4.5`.
- React `18.3.1`.
- React Router `7.16.0`.
- TypeScript `5.9.2` in strict mode.
- Vite `8.0.1`.
- Tailwind CSS `4.1.6` with the CSS-first Vite integration.
- Mini Oxygen `4.2.2`.
- Shopify CLI `3.93.2`.
- Node engine declaration `^22 || ^24`.
- Oxygen-compatible streaming SSR and Hydrogen cart, analytics, customer-account, catalog, search, content, robots, and sitemap routes.

The project was treated as a real Shopify storefront, not as a Mock.shop storefront. Shopify remained the source of truth for commerce data and customer behavior throughout the work.

Before BILDIT was added, the homepage marketing content was hard-coded in `app/routes/_index.tsx`. The page contained:

- A hard-coded hero section.
- A hard-coded editorial promotional banner.
- New-arrivals and best-seller Shopify product carousels.
- Featured collection cards.
- Size guide, testimonials, Instagram, and newsletter sections.
- Shopify links and Hydrogen commerce behavior outside the marketing sections.

The homepage hero and editorial banner were the natural boundaries for CMS control because they could be replaced without moving the rest of the page into a page-builder system.

The existing root loader already divided work into critical and deferred data. The header query was critical, while the footer, cart, and customer login state were deferred. Root `shouldRevalidate` was optimized to avoid root loader requests during ordinary route-to-route navigation by returning `false` except for mutations or manual revalidation.

The existing client entry already used Hydrogen's nonce provider, React `StrictMode`, `startTransition`, and the Google web-cache guard. The server entry already used Hydrogen's streaming SSR and generated Shopify Content Security Policy. These existing flows had to remain intact.

## BILDIT Reference Research

The BILDIT Hydrogen reference implementation was studied before changing the storefront. The goal was to match the adapter's intended integration pattern rather than invent a second CMS architecture.

The reference pattern established the following:

- Use the public `@bildit-platform/hydrogen` package.
- Use the server adapter to request scheduled content for the incoming request.
- Pass the resulting banners into the BILDIT root provider.
- Render CMS content through explicit `SlotPlaceholder` components.
- Initialize BILDIT host React globals before browser hydration.
- Register CMS dependencies before browser hydration.
- Use the adapter's built-in Visual Editor bridge rather than manually adding a CMS script.
- Merge BILDIT CSP requirements into Hydrogen's generated CSP instead of replacing Shopify's policy.
- Pass the incoming request and runtime environment to the adapter so it can resolve location, schedule, and preview-date behavior.
- Keep the API key on the server.
- Bundle the BILDIT adapter and its rendering dependencies for SSR rather than allowing Vite to externalize them in a way that can produce runtime module or duplicate-React problems.

The important adapter APIs identified from the reference pattern were:

- `getBannersForRequest` from `@bildit-platform/hydrogen/server`.
- `BannerType` and `BilditEnv` types.
- `BilditRoot` from `@bildit-platform/hydrogen/client`.
- `SlotPlaceholder` from `@bildit-platform/hydrogen/client`.
- `ensureHostReactGlobals` from `@bildit-platform/hydrogen/client`.
- `registerCmsDependencies` from `@bildit-platform/hydrogen/client`.
- `allowBilditIframeEmbedding` from `@bildit-platform/hydrogen/server`.
- `bilditCspDirectives` from `@bildit-platform/hydrogen/server`.

The reference implementation also made clear that BILDIT content can contain authored imports. The safe initial choice was to register no extra dependencies. The host can add explicitly approved non-React dependencies later if a published banner actually needs them.

The reference also showed why a manual `cms-client` script or a custom script injection listener was not appropriate:

- It could race browser hydration.
- It could create a second initialization path.
- It could expose or duplicate CMS behavior outside the supported adapter.
- It was rejected by the BILDIT Verify flow.

The final integration therefore used the BILDIT adapter's supported host initialization and bundled editor script.

## Requirements and Scope

An OpenSpec change named `integrate-bildit-homepage` was created to make the work explicit and verifiable.

The proposal established these goals:

- Add BILDIT to the existing Hydrogen/Oxygen application.
- Fetch BILDIT scheduled content server-side.
- Add two explicit homepage placements.
- Retain the current homepage UI as fallback content.
- Support the Visual Editor iframe and bridge.
- Extend CSP and Vite SSR handling for BILDIT.
- Preserve Shopify catalog, cart, checkout, account, analytics, SEO, and all homepage sections outside the two slots.
- Document the required runtime variables without exposing their values.

The proposal explicitly did not include:

- Replacing Shopify catalog, cart, checkout, customer accounts, or analytics.
- Making every route CMS-managed.
- Moving the entire homepage into BILDIT.
- Creating a generic page-builder abstraction.
- Adding CMS content to products, collections, header, or footer.
- Creating BILDIT accounts, keys, schedules, or Oxygen environments in application code.

The capability specification defined these behavior contracts:

- `home-hero` and `home-promo` must be available on the homepage.
- Active published content assigned to each placement must render in that placement.
- The existing hero and editorial banner must remain usable fallbacks.
- BILDIT request failures, invalid responses, or timeouts must not make the homepage unusable.
- Content must be matched to `/` and to the current request time.
- Supported Visual Editor preview dates must select content applicable to the preview date.
- Content assigned to another location must not replace homepage fallbacks.
- The Visual Editor must work without a manually hosted CMS script.
- BILDIT credentials must stay server-side.
- Shopify must remain the commerce source of truth.

The OpenSpec change was completed with 16 tasks covering dependency setup, runtime integration, provider and navigation behavior, CSP and SSR bundling, homepage slots, local validation, scheduled content, Visual Editor verification, and production validation.

## Implementation Changes

### Dependency and Lockfile

The public BILDIT Hydrogen adapter was added to `package.json`:

```json
"@bildit-platform/hydrogen": "^0.1.7"
```

The lockfile was synchronized. The resolved dependency tree included the BILDIT rendering packages, including the adapter, engine, and React core packages required by the adapter.

The dependency check used `npm ls @bildit-platform/hydrogen`. The package resolved without peer-dependency errors.

No unrelated package upgrades were made. The existing Hydrogen, React Router, Vite, Tailwind, TypeScript, and Shopify CLI versions were retained.

### BILDIT Authoring CLI

The BILDIT authoring CLI was subsequently added to `package.json`:

```json
"@bildit-platform/bild-cli": "^2.0.0-alpha.13"
```

This package manages BILDIT WebCMS templates and is used to validate, upload, pull, update, and version reusable banner components. It does not fetch storefront banners at runtime and does not replace the Hydrogen adapter.

The Standard Template Guide uses the legacy BILDIT `$()` field syntax. The CLI maps that workflow to:

- `bild template legacy init` for a starter component.
- `bild template legacy validate` for preprocessing, linting, and transpilation checks.
- `bild library add` to create a template in the CMS.
- `bild library update` to publish a new template version.

The project-local `2.0.0-alpha.13` package has a packaging issue: its entrypoint checks for dependencies under `node_modules/@bildit-platform/bild-cli/node_modules`, while npm hoists those dependencies to the project root. As a result, `npx bild --help` reports dependencies as missing even though `npm ls --all` shows them installed. The global CLI installation supplied by the user contains the expected nested dependencies and runs normally. The project-local template checks were initially run through the package's own parser, linter, and transpiler modules without changing the package or its dependencies.

The same alpha release's metadata parser currently returns an empty type for `Image` declarations, although its legacy preprocessor, codemod, and upload path support `Image` fields. The templates use the documented `Image` declaration and accept both the documented string form and the adapter's `{url, alt}` object form at render time. Both templates were accepted by the global CLI and added to the website library; the image field should still be visually checked in the BILDIT library preview before scheduling a production campaign.

### BILDIT CLI Setup and Website Workflow

The CLI workflow was completed after the runtime integration was already working. The global CLI was used for CMS operations because the project-local alpha package has the dependency-layout issue described above. The selected BILDIT resource was the `BILDIT Demo` website, not the similarly named app.

#### CLI Configuration

The CLI was initialized with:

```bash
bild init
```

The completed answers were:

- CMS instance URL: `https://admin.bildit.co`.
- Default App ID: blank.
- Default API Key: blank.
- React version: accepted the default `18.2.0`.
- Consumer website path: blank.
- `cmsDependencies` file path: accepted the default `src/cmsDependencies.ts`.
- `cmsDependencies` import alias: accepted the default `@/cmsDependencies`.
- Default CSS mode: `hybrid`.
- Default field naming strategy: `camelComponent`.

The CLI saved its configuration outside the repository at `~/.bild.json`. No API key was entered or saved in that file. The config contains the CMS URL, default authoring preferences, and the selected website resource after the resource-selection step.

The first `bild init` attempt was made without a usable interactive terminal and failed with Node's `ERR_USE_AFTER_CLOSE` readline error after displaying the CMS URL prompt. `bild init --help` showed no non-interactive configuration flags. A paced pseudo-terminal invocation was then used to complete the same command without changing the answers above.

#### Authentication

The standard OAuth flow was started with:

```bash
bild login
```

The CLI opened the BILDIT sign-in page in a browser. After the existing BILDIT account session completed authentication, the CLI reported `Authentication successful!` and stored the token in the operating system keychain under the CLI's `bild-cli` service. The token was never printed or copied into the repository.

Authentication was checked without exposing the token:

```bash
bild token --source
bild token --validate
```

The results were `Token source: keychain` and `Token is valid (JWT format)`.

The CLI also supports `bild login --token` for manually entering a bearer token and `bild login --password-login` for email/password authentication, but neither fallback was used because the normal browser OAuth flow succeeded.

#### Website Selection

The first attempt to discover resources used an invalid command:

```bash
bild list-apps
```

The CLI correctly rejected it with `unknown command 'list-apps'`. The supported command is:

```bash
bild app list
```

It returned one `BILDIT Demo App` entry and one `BILDIT Demo` website entry. Resource IDs were intentionally omitted from this record.

The default resource was selected with:

```bash
bild use
```

The selection was corrected during the workflow: the app entry was selected once while testing app-scoped access, then the user confirmed that the website was the intended target and the `BILDIT Demo` website entry was selected again. The final default is the website. The CLI stores both app and website selections in a config property named `defaultAppId`; that property name is a CLI schema detail and does not mean the final resource is the app.

Website-scoped access was verified with:

```bash
bild library list
```

Before uploading the new templates, this returned eight existing templates from the selected website. The command exited successfully, confirming that the authenticated CLI could read the website's template library.

For comparison, while the app entry was temporarily selected during resource disambiguation, the same command returned 38 templates. After the final website selection it returned eight website templates, confirming that the CLI resource choice changes the library scope.

#### Preview Images

`bild library add` requires a separate template-library preview image. This is not the editable `Image` field inside a template. The existing local Mini Oxygen development server was opened at the local storefront and inspected with Playwright CLI:

```bash
playwright-cli goto http://localhost:3000/
playwright-cli resize 1280 720
playwright-cli run-code "async page => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: '/tmp/opencode/home-hero-preview.png' }); }"
playwright-cli run-code "async page => { const promo = page.getByText('Timeless Elegance, Handcrafted for You'); await promo.scrollIntoViewIfNeeded(); await page.screenshot({ path: '/tmp/opencode/home-promo-preview.png' }); }"
```

The generated preview files were verified as 1280 by 720 PNG images:

```bash
file /tmp/opencode/home-hero-preview.png /tmp/opencode/home-promo-preview.png
```

The preview files were temporary files under `/tmp/opencode`; they were not added to the repository and contain no credentials.

#### Template Syntax Validation

Both templates use the legacy syntax required by the Standard Template Guide:

```jsx
const heroImage = $(heroImage:Image="");
const headline = $(headline:RichText={ text: "Latest Collection" });
const showCta = $(showCta:Boolean=true);
const ctaHref = $(ctaHref:String="/collections/new-arrivals");
const accentColor = $(accentColor:Color="#C9A25D");
```

The official global CLI validation commands were run after the image compatibility update:

```bash
bild template legacy validate bildit-templates/home-hero.template.jsx
bild template legacy validate bildit-templates/home-promo.template.jsx
```

Both returned `legacy validate: OK`. Each emitted one non-fatal warning that the `React` import is unused in the preprocessed validation source. The import remains because the legacy BILDIT JSX runtime and the uploaded component code use the React JSX contract.

The project-local package's equivalent entrypoint remained unavailable because of its hoisted-dependency check. Direct calls to that package's own legacy validation modules also returned `legacy validate: OK` for both files. No package source or dependency tree was patched to hide the local CLI issue.

#### Website-Scoped Template Upload

Because the website was selected as the CLI default, the actual upload commands did not include a private or copied resource ID:

```bash
bild library add "bildit-templates/home-hero.template.jsx" --template-id home-hero --code-type jsx --type Homepage --name "Singhar Home Hero" --description "Responsive Singhar by Sidra homepage hero" --image "/tmp/opencode/home-hero-preview.png"

bild library add "bildit-templates/home-promo.template.jsx" --template-id home-promo --code-type jsx --type Homepage --name "Singhar Home Promo" --description "Responsive Singhar by Sidra homepage promotional banner" --image "/tmp/opencode/home-promo-preview.png"
```

For each upload, the CLI displayed this optional prompt:

```text
Rewrite imports for cmsDependencies (record + namespace imports for external packages), update that file, and upload the rewritten code? (Y/n)
```

`n` was selected for both templates. The CLI's import analyzer suggested registering React and reported that its inferred `src/cmsDependencies.ts` path could not be validated. These templates intentionally use only React and browser primitives, and the storefront's host CMS dependency registry remains empty. Declining the prompt uploaded the original source unchanged and did not create or modify a `cmsDependencies` file.

The first direct upload attempt also failed with Node's `ERR_USE_AFTER_CLOSE` readline error when the non-interactive execution wrapper closed stdin at this confirmation prompt. The successful retries used a paced pseudo-terminal input and produced the same upload requests with the rewrite confirmation answered `n`.

Both uploads completed successfully with:

```text
Successfully added home-hero.template.jsx
Successfully added home-promo.template.jsx
All files added successfully!
```

The final website-scoped verification was:

```bash
bild library list
```

The library increased from eight to ten templates and included `Singhar Home Hero` and `Singhar Home Promo`. This verifies CMS authentication, website resource selection, preview image processing, template validation, template creation, and post-upload library access. It does not publish scheduled homepage content automatically.

#### CLI and Storefront Verification Boundaries

The CLI verifies access to BILDIT CMS resources and manages reusable templates. It does not replace the BILDIT dashboard's website Verify flow or the storefront's runtime integration checks.

The storefront connection was independently verified through the BILDIT dashboard and Live Editor: the website pointed to the deployed storefront, the BILDIT Verify flow reported that BILDIT was installed, the iframe exposed the `home-hero` and `home-promo` drop zones, a test banner rendered through the server adapter, and the production homepage preserved the Shopify-backed fallbacks. The CLI verification then confirmed that the same authenticated BILDIT account could manage the selected website's template library.

### Runtime Environment Typing

`env.d.ts` was extended with optional server runtime variables:

```ts
interface Env {
  BILDIT_API_KEY?: string;
  BILDIT_API_URL?: string;
}
```

These declarations describe runtime bindings only. They do not embed values, make the values public, or move the values into browser code.

The intended configuration is:

- `BILDIT_API_URL`: the BILDIT root CMS host, such as `https://admin.bildit.co`.
- `BILDIT_API_KEY`: the secret BILDIT API key.

The adapter appends its scheduled-content endpoint to the configured root host. The application does not construct a separate BILDIT API client.

Local Mini Oxygen reads these values from the ignored local environment file. Oxygen receives the same variable names as deployment environment values, with the API key stored as a secret. No `.env` values were committed.

### Server BILDIT Loader

`app/lib/bildit.ts` was added as the server-only homepage loader helper.

Its behavior is:

1. Inspect the incoming request pathname.
2. Return an empty banner list for any pathname other than `/`.
3. Call `getBannersForRequest(request, env)` for the homepage.
4. Race the BILDIT request against a 3,000 millisecond timeout.
5. Log a timeout diagnostic and return an empty list when the timeout wins.
6. Log a request failure and return an empty list when the adapter throws.
7. Clear the timeout in a `finally` block.

The key implementation boundary is that the API key is consumed by the server adapter from `env`. It is never passed to a client component, included in `loaderData`, rendered into markup, or used by a browser fetch.

The empty-list fallback makes BILDIT failure non-fatal. The homepage still renders its normal Shopify-backed experience when BILDIT is missing, unavailable, slow, or invalid.

The timeout is a response-time safeguard. It does not cancel the underlying promise at the transport level; it only ensures that the homepage does not wait indefinitely for the BILDIT request. This was accepted because the adapter owns the underlying request and the storefront needs a usable fallback quickly.

### CMS Dependency Registry

`app/lib/cmsDependencies.ts` was added.

It exports:

- `extraDependenciesConfig`, currently an empty `Record<string, ExtraDependencyConfig>`.
- `registerHostCmsDependencies()`, which calls `registerCmsDependencies(extraDependenciesConfig)`.

The registry is intentionally empty at first. This avoids allowing arbitrary authored imports into the browser or SSR bundle. If future BILDIT content imports an approved non-React module, that module must be explicitly registered and bundled before publishing the content.

### Root Loader and Provider

`app/root.tsx` was updated in several connected places.

The root imports `BilditRoot`, `Script`, `extraDependenciesConfig`, and `getHomepageBanners`.

The critical root loader now requests the Shopify header and BILDIT homepage banners in parallel with `Promise.all`. This preserves the existing critical/deferred separation and avoids a request waterfall:

```ts
const [header, banners] = await Promise.all([
  storefront.query(HEADER_QUERY, ...),
  getHomepageBanners(request, context.env),
]);
```

The root loader return value now includes `banners` while retaining the existing header, footer, cart, account, shop analytics, consent, public domain, and year data.

The React tree is now composed as:

```text
BilditRoot
  Analytics.Provider
    PageLayout
      Outlet
```

The existing Shopify analytics provider remains mounted inside `BilditRoot`. `PageLayout` and the route outlet remain unchanged in their role.

The provider receives `data.banners ?? []` and the extra dependency configuration. This ensures that an absent or failed BILDIT response is treated as no scheduled content rather than as a render-breaking value.

The root revalidation function was changed from the previous optimized `false` result to targeted homepage revalidation:

- Mutations still return `true` so cart, login, and other mutation state can refresh.
- Manual revalidation still returns `true`.
- A navigation revalidates when the current pathname is `/`.
- A navigation revalidates when the next pathname is `/`.
- Unrelated route-to-route navigation retains the optimization.

This is needed for three cases:

- Navigating from a product or collection route to `/` must request the homepage banner set.
- Leaving `/` must clear homepage-specific BILDIT data from the provider.
- Changing homepage query parameters, including preview-date parameters, must request the applicable schedule.

The root document layout also includes the Tailwind browser runtime supplied by the BILDIT integration requirements:

```tsx
<Script
  src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
  nonce={nonce}
  waitForHydration
/>
```

The existing Hydrogen nonce is used. The script waits for hydration and does not replace the existing CSS-first Tailwind stylesheet.

### Browser Bootstrap

`app/entry.client.tsx` now calls these functions before `hydrateRoot`:

```ts
ensureHostReactGlobals();
registerHostCmsDependencies();
```

The existing browser behavior was preserved:

- `HydratedRouter` remains the React Router entry.
- Hydration remains wrapped in `StrictMode`.
- Hydration remains scheduled through `startTransition`.
- The nonce is extracted from existing script tags and provided through Hydrogen's `NonceProvider`.
- The Google web-cache guard remains in place.

No manual CMS script tag, `cms-client` injection, or custom `INJECT_SCRIPT` listener was added.

### Server CSP and Visual Editor Iframe Support

`app/entry.server.tsx` now imports `allowBilditIframeEmbedding` and `bilditCspDirectives` from the BILDIT server adapter.

Hydrogen's generated policy is still created with the existing Shopify checkout and store domains. BILDIT directives are merged into that policy rather than replacing it.

The final CSP handling:

1. Creates the normal Hydrogen and Shopify CSP.
2. Spreads in `bilditCspDirectives`.
3. Retains BILDIT script sources and adds the documented jsDelivr source to `scriptSrc`.
4. Retains BILDIT connect sources and adds the documented jsDelivr source to `connectSrc`.
5. Passes the resulting header through `allowBilditIframeEmbedding`.
6. Sets the merged policy on the HTML response.

The existing streaming SSR behavior was preserved, including:

- The Hydrogen nonce provider.
- `renderToReadableStream`.
- Request abort signal support.
- Bot-aware `body.allReady` handling.
- Existing response status and error logging behavior.

The CSP changes allow the supported Visual Editor iframe context while retaining Shopify sources and the storefront's nonce flow.

During local browser validation, the active BILDIT hero image was served from a `*.public.blob.vercel-storage.com` host. The base BILDIT CSP directives did not include that storage origin, so the image was blocked even though the BILDIT banner itself rendered. `app/entry.server.tsx` now preserves the adapter's `imgSrc` values and adds the BILDIT Vercel Blob host pattern. This is limited to `img-src`; script and connection sources remain controlled by the adapter's existing allow-list.

### Vite SSR Bundling

`vite.config.ts` was updated for the BILDIT renderer.

React packages were deduped through Vite resolution:

```ts
dedupe: ['react', 'react-dom', 'react-dom/client'];
```

The BILDIT adapter and rendering dependencies were added to SSR `noExternal`:

- `@bildit-platform/hydrogen`.
- `@bildit-platform/react-core`.
- `@bildit-platform/engine`.
- `react-error-boundary`.
- `react-fast-compare`.

The dependency optimization include list was extended with the packages needed to avoid CJS/ESM and duplicate-React issues:

- `react-is`.
- `react-dom/client`.
- `react-error-boundary`.
- `react-fast-compare`.

The existing Hydrogen, Mini Oxygen, React Router, Tailwind, alias, allowed-host, and strict CSP-related `assetsInlineLimit: 0` settings were retained.

### Homepage Slots

`app/routes/_index.tsx` now imports `SlotPlaceholder`.

The existing hero is wrapped in the `home-hero` placement:

```tsx
<SlotPlaceholder slotId="home-hero" fallback={<Hero href={heroHref} />} />
```

The existing editorial banner is wrapped in the `home-promo` placement:

```tsx
<SlotPlaceholder slotId="home-promo" fallback={<EditorialBanner />} />
```

The rest of the homepage remains ordinary Hydrogen/React content. Product carousels, product links, collection links, size guide, testimonials, Instagram, newsletter, and the configuration diagnostic remain outside BILDIT slots.

The editorial picture helper was also made tolerant of missing mobile or desktop asset values by conditionally rendering the corresponding source and image elements. This prevents an incomplete authored asset from producing an invalid image element while retaining the existing fallback behavior.

### Reusable Homepage Templates

Two legacy BILDIT templates were authored under `bildit-templates/` and uploaded to the selected `BILDIT Demo` website:

- `home-hero.template.jsx`: Responsive hero for the `home-hero` slot. It exposes an image, eyebrow, headline, supporting copy, CTA label and URL, CTA visibility, accent color, text color, and fallback color. With no image, it renders the same beige and nude editorial treatment used by the storefront fallback.
- `home-promo.template.jsx`: Responsive promotional banner for the `home-promo` slot. It exposes an image, title, supporting copy, CTA label and URL, CTA visibility, accent color, and fallback color. With no image, it renders the same darkened nude and brown editorial treatment used by the storefront fallback.

Both files:

- Use top-level `$()` declarations and `// group` / `// endgroup` markers required by the legacy template format.
- Export a default functional React component.
- Use only React and browser primitives, so no entries were added to `app/lib/cmsDependencies.ts`.
- Use fluid `clamp()` sizing, intrinsic flex layout, explicit image dimensions through full-bleed positioning, readable contrast overlays, semantic headings, links, and image alt text.
- Keep CTA URLs and text authored through CMS fields while retaining safe storefront defaults.

The templates were uploaded to the selected `BILDIT Demo` website after the global CLI was authenticated. The exact commands, preview image creation, dependency prompt answer, and post-upload verification are recorded in [BILDIT CLI Setup and Website Workflow](#bildit-cli-setup-and-website-workflow). The template `Image` field and the CLI's required template preview image are separate: the former is editable banner content, while the latter is the library preview shown to editors.

The final `bild library list` returned ten templates, including `Singhar Home Hero` and `Singhar Home Promo`. The upload did not publish scheduled homepage content automatically; content still needs to be assigned to `Location: /` and the matching `Web Slot ID` (`home-hero` or `home-promo`) in WebCMS.

### Existing Commerce Preservation

No BILDIT code was added to product pages, collection pages, cart mutations, checkout generation, customer account operations, analytics events, or SEO route generation.

The BILDIT integration only supplies server-loaded homepage banner data and the two homepage placements. Shopify remains responsible for:

- Product and collection data.
- Product variant resolution.
- Cart state and cart mutations.
- Checkout URL generation.
- Customer Account API authentication and data.
- Shopify analytics provider behavior.
- Robots and sitemap resources.
- Route metadata and canonical behavior.

## Admin and Deployment Configuration

### BILDIT Website Setup

The BILDIT website record was configured with the deployed storefront URL. The exact store URL and BILDIT organization identifier are intentionally redacted in this document.

The setup initially had the BILDIT website environment marked as Development. This was later changed in the BILDIT admin panel to Production, as confirmed after the integration validation.

The BILDIT website record also displayed a temporary trial warning showing remaining trial days. This was an account-plan notice and did not prevent the adapter, Live Editor, scheduled content, or Verify flow from working.

### Runtime Secrets

The following were configured in the intended Oxygen environment:

- `BILDIT_API_URL` with the BILDIT CMS host.
- `BILDIT_API_KEY` as a secret deployment variable.

The application did not use `PUBLIC_BILDIT_API_KEY` or another public variable name. The key was not placed in `package.json`, source code, `AGENTS.md`, OpenSpec files, browser markup, browser props, client requests, or screenshots.

The BILDIT adapter consumed the values through `context.env` during server rendering.

### Deployment

After the Oxygen environment was configured, the storefront was redeployed. The deployed homepage responded with the BILDIT content when the scheduled item was active.

The production deployment remained compatible with Hydrogen's server handler, CSP generation, streaming SSR, cart cookie behavior, and Shopify checkout handoff.

## Dashboard Content Workflow

### Initial Location and Slot Work

The BILDIT dashboard initially required a homepage location to be created or saved. The `/` location was created and selected for the homepage content.

The intended stable CMS contracts were:

- Location: `/`.
- Hero placement: `home-hero`.
- Promotional placement: `home-promo`.

These identifiers had to match the `slotId` values in the homepage route exactly.

### Scheduled Content Item

One temporary test item was created and published for validation:

- Item name: `BILDIT Hero Integration Test`.
- Location: `/`.
- Placement: `home-hero`.
- Template: `Summer Collection` / `summer-hero`.

The published content rendered the following visible content during validation:

- `50% Off All Sales`.
- `New Summer Collections`.
- Supporting placeholder copy supplied by the selected BILDIT template.
- `Preview the Sale` and `Explore More` actions.

The item was inserted from the Live Editor and published through the `Publish All` flow. The `home-promo` placement was left without a published CMS item so its native editorial fallback could be verified at the same time.

## Issues Encountered and Mitigations

### Empty Scheduler Locations and Web Slots

The BILDIT scheduler API and dashboard initially showed empty `locations` and `webSlots` data. A direct test POST returned a successful response, but the subsequent list response still appeared empty. This made the normal scheduled-content form unreliable for selecting the intended homepage placement.

Mitigation:

- Created and saved the `/` location in the dashboard.
- Used the BILDIT Live Editor route, which recognized the storefront's injected slot drop zones.
- Clicked the `home-hero` drop zone.
- Opened the component library.
- Selected the `Summer Collection` / `summer-hero` template.
- Used `Insert Selected`.
- Published the inserted item with `Publish All`.

The production result proved that the published item was returned and rendered correctly even though the scheduler list UI had initially been empty.

Follow-up:

- The scheduler API inconsistency was not treated as an application integration failure because Live Editor insertion, publication, server loading, and storefront rendering all succeeded.
- Future campaign setup should confirm that the BILDIT dashboard now lists the intended locations and slots before creating additional content.

### Initial BILDIT Verify Failure

An early Verify attempt reported:

```text
Script not found or invalid. Install the script, then try again.
```

This was misleading because the storefront was using the supported Hydrogen adapter bridge rather than a manually hosted BILDIT script. The direct Live Editor route was able to load the storefront iframe and display the BILDIT slot controls even while Verify reported the error.

Mitigation:

- Confirmed the website URL pointed to the deployed storefront.
- Confirmed the adapter's `BilditRoot`, client host initialization, and CSP iframe helper were present.
- Confirmed no manual CMS script was injected.
- Confirmed the iframe loaded with the Live Editor query parameter.
- Retried Verify after the website configuration was corrected.
- Changed the BILDIT website environment from Development to Production in the admin panel.

The later Verify attempt succeeded and reported:

```text
BILDIT is installed on your site.
```

This established that the initial Verify result was an admin/configuration timing or environment-state issue, not proof that a manual script should be added to the Hydrogen document.

### Live Editor Component Selection State

When the component library first opened, `Insert Selected` was disabled because no template had been selected. The library displayed `Select a template to preview`.

Mitigation:

- Selected the `Summer Collection` template in the library tree.
- Waited for the preview and selection state to update.
- Inserted the selected template only after `Insert Selected` became available.

### Live Editor Dialog and Drop Zones

The Live Editor exposed the two slot controls inside the storefront iframe:

- `home-hero` showed one scheduled item after publication.
- `home-promo` showed zero scheduled items and a clickable add-content drop zone.

The editor bridge exposed both controls without requiring additional document-head code. Closing the component library returned to the editable iframe view.

### Checkout Navigation Timeout in Playwright

When the checkout link was clicked from the cart drawer, the CLI action reported a five-second navigation timeout. The action log showed that navigation had actually happened and that the browser had reached Shopify's checkout URL before the timeout was raised.

Mitigation:

- Checked the current page after the timeout instead of treating the action as an application failure.
- Confirmed the browser had left the Hydrogen storefront and reached the Shopify checkout handoff.

The Shopify checkout domain then redirected to the store password page because the storefront was not yet publicly launched. This is expected pre-launch behavior and is outside the BILDIT integration.

### `networkidle` Timeout During Production Smoke Test

A production smoke script initially used `waitUntil: 'networkidle'`. The homepage did not become network-idle within the 30-second limit, which is common for pages with long-lived or third-party requests.

Mitigation:

- Re-ran the check with `waitUntil: 'domcontentloaded'`.
- Waited briefly for the application and deferred content to settle.
- Collected the required page, metadata, and layout assertions successfully.

### Browser Console Noise

The storefront loaded without observed hydration errors. Some browser sessions still reported non-hydration errors associated with third-party blocked requests or browser Permissions Policy behavior. The BILDIT iframe and storefront content continued to load, and no BILDIT API key or failed required BILDIT request was exposed in the browser.

The BILDIT admin pages also produced their own console entries while loading tables, dialogs, and dashboard resources. Those admin-console entries were kept separate from the storefront integration result.

### OpenSpec CLI Archive Behavior

The BILDIT delta specification was synced into the new main spec at `openspec/specs/bildit-homepage/spec.md`.

After that sync, `openspec archive --yes` attempted to apply the ADDED requirement again and aborted with an already-exists message. It reported that no files were changed.

Mitigation:

- Confirmed the main spec matched the delta.
- Ran strict spec validation successfully.
- Used the OpenSpec archive workflow's explicit directory move to place the completed change under the dated archive directory.
- Ran archived-change validation successfully.

This was an OpenSpec CLI behavior around an already-synced new capability, not a storefront implementation error.

## Validation Process

### Static and Build Checks

The following repository checks were run during the implementation and finalization:

- `npm ls @bildit-platform/hydrogen`.
- `npm run codegen`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- `openspec validate "integrate-bildit-homepage" --type change --strict`.
- `openspec validate --specs --strict`.
- `openspec validate --archived --strict`.

The application checks completed without new TypeScript, lint, build, or generated-type errors.

The TypeScript command emitted existing tool warnings about the deprecated `envFile` option and React Router future flags. These warnings did not fail the command and were unrelated to the BILDIT implementation.

The final strict spec validation result was seven passing main specs, including `bildit-homepage`. The final archived validation result was seven passing archived changes, including `2026-09-11-integrate-bildit-homepage`.

### Local Mini Oxygen and Browser Checks

The local development server was started with the configured ignored environment values. The homepage was inspected at desktop and mobile-sized viewports through Playwright CLI.

The local checks covered:

- Homepage rendering with no CMS content.
- Hero fallback rendering.
- Promotional fallback rendering.
- Product carousel links.
- Collection links.
- Desktop layout.
- Mobile layout.
- Horizontal overflow.
- Hydration behavior.
- BILDIT request behavior.
- Header, cart, account, and route navigation.

### Production Homepage and Preview-Date Checks

The deployed storefront was inspected at a mobile viewport of 390 by 844 and at a desktop viewport of 1280 by 900.

The active homepage check confirmed:

- The published BILDIT hero rendered `50% Off All Sales`.
- The published BILDIT hero rendered `New Summer Collections`.
- The `home-promo` placement remained on its native `Timeless Elegance` fallback.
- The document had no horizontal overflow in the mobile check. The measured document scroll width was 375 pixels in the 390 pixel viewport.
- Shopify product cards and links remained visible.

The active schedule was checked at a supported preview-date URL using:

```text
?bildit_preview_date=2026-09-11T12:00:00.000Z
```

The published hero rendered for the applicable date.

A future date was checked using:

```text
?bildit_preview_date=2026-09-12T12:00:00.000Z
```

The temporary published hero did not render for the future date, and the native `THE NEW SEASON` / `Latest Collection` fallback appeared. The promotional fallback remained visible. This confirmed request-time schedule matching and fallback isolation.

### Live Editor and Verify Checks

The BILDIT Live Editor loaded the deployed homepage inside its iframe with the supported editor query parameter.

The iframe showed:

- The `home-hero` slot label and scheduled item count.
- The published `summer-hero` content.
- The `home-promo` slot label and zero-item state.
- The `home-promo` add scheduled content control.

The component library opened from a slot drop zone. The template list loaded. The selected template was inserted and published successfully.

The BILDIT Verify flow was retried after the deployment and admin environment corrections. It reported that BILDIT was installed on the site.

No manually hosted CMS script was added to the document head. The supported adapter bridge handled the Live Editor interaction.

### Commerce Smoke Checks

The production storefront returned successful page responses for:

- `/collections/all`.
- A real Shopify product route.
- `/cart`.
- `/account`, which normalized to the unauthenticated account orders route.

The product page rendered Shopify product data, variant options, price, product image, and `Add to Cart`.

The cart check confirmed:

- A product could be added to the cart.
- The cart drawer showed one item.
- The item title, variant selections, quantity, and price were displayed.
- Cart totals were calculated.
- The existing Shopify checkout link was generated.

The checkout link reached Shopify's checkout handoff and then the store password page. The store password page is expected while the storefront is unfinished and does not indicate a BILDIT failure.

No purchase was made and no customer data was accessed.

### SEO and Metadata Checks

The production homepage returned:

- The expected page title.
- The expected meta description.
- A root canonical link.

The current unfinished-store environment returned these expected pre-launch conditions:

- `/robots.txt` returned `Disallow: /`.
- `/sitemap.xml` returned `404`.

The storefront owner confirmed that the proper domain and finished public site are not yet in place, so these results are expected until launch configuration is complete. They were not treated as BILDIT integration defects.

### Secret Boundary Checks

The integration was checked against the credential boundary:

- The key is read through server runtime environment bindings.
- The key is not defined as a `PUBLIC_` variable.
- The key is not returned from the root loader.
- The key is not rendered into HTML.
- The key is not passed to client components.
- The key is not used in browser fetch requests.
- The browser-visible BILDIT data consists of the banner content needed to render the page, not the API credential.

## Final Data Flow

The final request and render flow is:

```text
Browser request for /
  -> Hydrogen root loader
  -> Shopify header query and BILDIT request run in parallel
  -> BILDIT adapter reads BILDIT_API_URL and BILDIT_API_KEY on the server
  -> BILDIT matches location, publication status, request time, and preview date
  -> Root loader returns banners or an empty list
  -> BilditRoot receives the banner list
  -> Homepage SlotPlaceholder checks home-hero and home-promo
  -> Active matching CMS content renders when available
  -> Existing Hero or EditorialBanner renders when unavailable
  -> Shopify analytics, catalog, cart, customer account, and checkout remain active
```

The editor flow is:

```text
BILDIT Live Editor
  -> Opens deployed homepage in supported iframe context
  -> Hydrogen CSP permits the editor iframe
  -> BILDIT bridge discovers homepage slot placeholders
  -> Marketing user selects or edits scheduled content
  -> Content is saved and published in BILDIT
  -> Storefront request receives matching content from the server adapter
```

## Final File Inventory

### Application Files

- `app/lib/bildit.ts`: Server-only BILDIT request helper with homepage pathname guard, timeout, and fallback error handling.
- `app/lib/cmsDependencies.ts`: Host CMS dependency registry, currently empty by design.
- `app/root.tsx`: BILDIT banner loading, targeted root revalidation, `BilditRoot`, Shopify analytics nesting, and nonce-protected Tailwind runtime.
- `app/entry.client.tsx`: BILDIT host React global and CMS dependency initialization before hydration.
- `app/entry.server.tsx`: Merged Shopify/BILDIT CSP, BILDIT iframe embedding, and existing streaming SSR.
- `app/routes/_index.tsx`: `home-hero` and `home-promo` slot boundaries with existing fallbacks.
- `vite.config.ts`: React deduplication, BILDIT SSR bundling, and dependency optimization.
- `env.d.ts`: TypeScript declarations for `BILDIT_API_URL` and `BILDIT_API_KEY`.
- `package.json`: BILDIT adapter and authoring CLI dependencies.
- `package-lock.json`: Synchronized BILDIT dependency tree.
- `bildit-templates/home-hero.template.jsx`: Legacy reusable `home-hero` banner template.
- `bildit-templates/home-promo.template.jsx`: Legacy reusable `home-promo` banner template.
- `eslint.config.js`: Ignores `*.template.*` files because legacy `$()` source is intentionally preprocessed by BILDIT before linting.
- `@bildit-platform/bild-cli`: Follow-up CMS template authoring and management CLI dependency.

### Planning and Specification Files

- `openspec/changes/archive/2026-09-11-integrate-bildit-homepage/proposal.md`: Why the change was needed and what it included.
- `openspec/changes/archive/2026-09-11-integrate-bildit-homepage/design.md`: Architecture decisions, risks, migration, and rollback plan.
- `openspec/changes/archive/2026-09-11-integrate-bildit-homepage/specs/bildit-homepage/spec.md`: Archived delta behavior specification.
- `openspec/changes/archive/2026-09-11-integrate-bildit-homepage/tasks.md`: Completed 16-task implementation and validation checklist.
- `openspec/specs/bildit-homepage/spec.md`: Main synchronized capability specification.
- `bildit integration.md`: This full integration record.

## Rollback and Failure Behavior

If BILDIT becomes unavailable or misconfigured:

- The server helper returns an empty banner list after a failure or timeout.
- The `home-hero` fallback renders.
- The `home-promo` fallback renders.
- The rest of the homepage remains usable.
- Shopify catalog and commerce routes are not replaced by CMS data.

If a deployment must be fully rolled back, deploy the previous Hydrogen build. Removing the BILDIT runtime variables also causes empty BILDIT content and fallback rendering, but it does not remove the BILDIT editor CSP or dependency code from that build.

If an authored BILDIT item imports a dependency that is not registered, the dependency must be added to `extraDependenciesConfig` and the SSR bundle configuration reviewed before publishing the item.

## Current Operational Guidance

For a new homepage campaign:

1. Confirm the BILDIT website points to the intended deployed storefront environment.
2. Confirm the website is marked Production when validating the public deployment.
3. Create or select location `/`.
4. Use `home-hero` for hero campaigns or `home-promo` for promotional campaigns.
5. Use Live Editor to confirm the slot appears in the intended position.
6. Set the schedule and publish the content.
7. Open the normal homepage to check active rendering.
8. Use a preview-date URL to check a future schedule.
9. Confirm that the other slot still shows its fallback or its own assigned content.
10. Do not add a manual CMS script to the document head.
11. Do not put BILDIT secrets into authored content, browser props, or public environment variables.
12. If a new authored module import is required, register and bundle it explicitly before publishing.
13. For the reusable homepage templates, use the already uploaded `Singhar Home Hero` or `Singhar Home Promo` library item; use `bild library update` for later source changes.

## Remaining Launch Work

The BILDIT runtime integration and CLI template upload are complete, and the OpenSpec change is archived. The following are operational or storefront launch tasks rather than unfinished implementation tasks:

- Point the BILDIT website record and Oxygen deployment at the proper public domain when available.
- Remove the storefront password gate when the store is ready to launch.
- Recheck Shopify checkout after the public domain and launch configuration are active.
- Recheck `robots.txt` and `sitemap.xml` after the public SEO configuration is complete.
- Replace or remove the temporary `BILDIT Hero Integration Test` campaign before running a real marketing campaign.
- Preview the uploaded `Singhar Home Hero` and `Singhar Home Promo` fields in the BILDIT library, then assign them to scheduled content when a campaign is ready.
- Investigate the BILDIT dashboard's location and web-slot list if future campaign creation still shows empty lists.
- Continue monitoring third-party browser console noise separately from hydration and BILDIT request failures.

## Final Outcome

BILDIT is integrated into the Singhar by Sidra Hydrogen storefront through the supported Hydrogen adapter pattern.

The integration provides:

- Server-side scheduled BILDIT content loading.
- Secure server-only credentials.
- Explicit `home-hero` and `home-promo` placements.
- Existing storefront fallbacks.
- Request-time and preview-date matching.
- Visual Editor iframe and bridge support.
- Verified BILDIT installation through the admin Verify flow.
- Production environment configuration.
- Shopify commerce preservation.
- Targeted root revalidation.
- CSP and SSR bundling support.
- Local, production, browser, OpenSpec, and archived-change validation.
- Authenticated global BILDIT CLI configured against the `BILDIT Demo` website.
- Website-scoped library access verified before and after template upload.
- `home-hero` and `home-promo` reusable templates uploaded with library preview images.

All 16 OpenSpec tasks were marked complete. The BILDIT capability specification was synchronized into the main specs directory, and the completed change was archived under the dated archive directory.
