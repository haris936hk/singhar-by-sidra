## Context

See `proposal.md` for the motivation and scope. The `/collections` route currently loads a four-item Shopify collection connection with `getPaginationVariables`, renders it through the generic `PaginatedResourceSection`, and displays each collection as a square image followed by a heading. The route has no directory-specific visual structure, while the global stylesheet already defines the Singhar by Sidra tokens, Playfair Display and Inter typography, editorial image treatments, and responsive spacing used by the homepage and product-grid routes.

The collection detail route and the all-products route already own the product-grid filter, sort, and product-card presentation. This change must not couple the directory to those controls or alter their behavior.

## Goals / Non-Goals

**Goals:**

- Give `/collections` a distinct editorial directory treatment that feels native to the existing storefront rather than to the Hydrogen starter.
- Keep collection destinations driven entirely by the existing Shopify collection connection.
- Make image-led cards, pagination, focus states, and responsive behavior usable across desktop, tablet, and mobile widths.
- Preserve server rendering, cursor pagination, intent prefetching, Shopify image handling, and existing global layout behavior.

**Non-Goals:**

- Do not redesign `/collections/:handle` or `/collections/all`.
- Do not add collection descriptions, taglines, filters, sorting, product cards, quick-buy controls, or a second content source.
- Do not add a new component library, styling system, dependency, Storefront API field, or analytics event.

## Decisions

### Use a dedicated directory surface

The route will use directory-specific root, grid, card, and pagination class names rather than relying on the generic `.collections`, `.collections-grid`, and `.collection-item` selectors. This prevents the old starter rules from leaking into the new presentation and avoids changing shared collection-detail or content-route styling.

The page structure will be:

```text
main
  directory surface
    breadcrumb
    editorial introduction
    collection directory
      collection card
      collection card
      ...
    previous/load-more pagination
```

The existing `PageLayout` header and footer remain outside the route surface and are not modified.

### Keep Shopify as the only collection source

The current query fields, title, handle, and image, are sufficient for the directory. Collection-specific supporting copy will not be synthesized from handles or hard-coded per collection. The introduction may reuse the existing `siteConfig.brand.statement` so the page has editorial context without adding a new content model or Storefront request.

Adding `description` or custom marketing fields was considered and rejected for this change. It would introduce content-quality decisions and require additional copy behavior without being necessary for the requested visual improvement.

### Use editorial image cards

Each collection destination will be a single block link containing a `3:4` image area and a title overlay. The image area will use the existing ivory/beige/nude patterned treatment when Shopify has no image, while a Shopify image will fill the area with `object-fit: cover`. A restrained bottom gradient will maintain title contrast without turning the card into a heavy panel.

This follows the approved collection and homepage references, which use full-bleed `3:4` imagery, Playfair Display titles, subtle overlays, small radii, and minimal borders. It is preferred over square cards with captions below because the latter is the current starter presentation and does not provide the intended editorial hierarchy.

### Use responsive grid breakpoints

The directory will use two columns at narrow widths, three columns at intermediate widths, and four columns on wide desktop screens. The grid will use the existing content-width rhythm: narrow mobile gutters, 64px desktop side gutters, a maximum width of 1312px, and modest gaps that keep the imagery dominant.

Card titles will be allowed to wrap within the overlay, with balanced text and sufficient bottom padding. The design will not depend on hover to reveal the title or destination. Pointer-capable devices may receive the existing restrained image scale response; coarse-pointer devices will use the resting card state.

### Use Hydrogen Pagination directly for route-specific presentation

The existing `PaginatedResourceSection` remains appropriate for routes that accept its generic markup, but its outer wrapper and pagination links do not expose enough route-specific hooks for the directory's editorial layout. The route will use Hydrogen's `Pagination` render primitive directly so previous and next controls can be placed in a dedicated pagination region with explicit styling and accessible labels.

The loader's `pageBy: 4`, cursor variables, and connection shape remain unchanged. `PreviousLink` and `NextLink` continue to perform Hydrogen pagination navigation; no custom fetcher, client-side collection cache, or replacement of the URL cursor state will be introduced.

### Preserve image performance and accessibility

The Hydrogen `Image` component will continue to consume Shopify image data. The card will retain explicit `3:4` geometry to prevent layout shift, use `sizes` matching the responsive column count, keep the current limited eager-loading strategy for the first visible items, and lazy-load later items. Image alternative text will use Shopify's alt text with the collection title as the meaningful fallback.

The page heading will remain the sole `h1`. Each card title will become a heading at the appropriate subordinate level inside its linked card. Links and pagination controls will have visible `:focus-visible` treatment from the existing gold focus contract. Decorative fallback backgrounds and gradients will not be exposed as redundant content to assistive technology.

### Keep motion bounded and preference-aware

Card image feedback and pagination/control transitions will use the existing fast and standard motion tokens, only changing transform, opacity, color, border, or background. No layout dimensions, grid placement, or whole-page content updates will be animated. The directory-specific motion rules will be disabled or made immediate under `prefers-reduced-motion: reduce`, consistent with the existing collection motion specification.

## Risks / Trade-offs

- [A collection has no image] -> Render a stable patterned media area so the card retains its aspect ratio and title destination instead of collapsing or showing an incomplete tile.
- [A collection title is unusually long] -> Allow wrapping within a padded overlay and validate at narrow widths so the title does not clip or cover the card edge.
- [The existing generic collections selectors override the new layout] -> Use dedicated directory class names and keep the new rules scoped to the route surface.
- [The directory loads too many large images] -> Keep the Shopify image component, accurate responsive `sizes`, explicit aspect ratios, and bounded eager loading; verify the network requests in the browser.
- [Pagination styling diverges from other routes] -> Reuse Hydrogen's `Pagination` primitive and the established storefront control tokens while limiting markup changes to this route.
- [Reduced-motion users lose state feedback] -> Disable only non-essential movement; retain title, focus, hover-independent links, and pagination state through static color, border, and text treatments.

## Migration Plan

1. Update the `/collections` route markup to use the dedicated directory structure while retaining the existing loader and Shopify collection fields.
2. Add the scoped responsive directory and card styles to `app/styles/tailwind.css` and remove reliance on the generic starter selectors for this route.
3. Run typecheck and lint, then build the storefront to confirm the route and generated types remain valid.
4. Run the local Hydrogen development server and inspect `/collections` at desktop, tablet, and mobile widths, including keyboard focus, missing-image fallback, and cursor pagination.
5. Roll back by restoring the previous route markup and scoped stylesheet changes; no data migration, dependency rollback, or Shopify configuration change is required.
