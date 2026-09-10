## Why

The homepage's marketing content is currently hard-coded in the Hydrogen application, so campaign updates require code changes and a storefront deployment. BILDIT can give the marketing team scheduled visual content and live preview control while Shopify remains the source of truth for commerce data.

## What Changes

- Add the BILDIT Hydrogen SDK integration to the existing Shopify Hydrogen/Oxygen application.
- Fetch BILDIT scheduled content server-side for the current request and render it through explicit homepage slots.
- Enable BILDIT's Visual Editor bridge without replacing the existing Hydrogen hydration flow.
- Add homepage slots for the hero and promotional content, each retaining the current Singhar by Sidra UI as fallback content.
- Extend the existing Vite SSR and Content Security Policy configuration for BILDIT's runtime and editor.
- Document the required local and Oxygen environment variables without exposing their values.
- Preserve Shopify catalog, cart, checkout, customer accounts, analytics, SEO, and existing homepage sections outside the selected slots.

## Capabilities

### New Capabilities

- `bildit-homepage`: Render scheduled BILDIT marketing content in homepage slots with safe fallbacks and Visual Editor support.

### Modified Capabilities

None.

## Impact

- Application files: `app/root.tsx`, `app/entry.client.tsx`, `app/entry.server.tsx`, `app/routes/_index.tsx`, `vite.config.ts`, and a small BILDIT dependency/configuration module.
- Dependencies: the public `@bildit-platform/hydrogen` package and its transitive runtime dependencies.
- Runtime configuration: `BILDIT_API_KEY` and `BILDIT_API_URL` in local MiniOxygen and the relevant Oxygen environments.
- External systems: BILDIT's scheduled-content endpoint and Visual Experience Engine iframe.
- Security and performance: CSP directives, iframe embedding policy, server-side third-party requests, and root-loader revalidation behavior require validation.
