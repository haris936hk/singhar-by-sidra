## 1. Directory Route Structure

- [x] 1.1 Replace the starter `/collections` wrapper with a directory-specific semantic surface containing breadcrumbs, an editorial introduction, a collection directory, and a pagination region; verify the route retains one page `h1` and the existing header and footer remain outside the route surface.
- [x] 1.2 Render the collection connection with Hydrogen's `Pagination` primitive and route-specific previous/load-more hooks; verify the existing `pageBy: 4` cursor variables and URL-based pagination behavior are unchanged.
- [x] 1.3 Update each collection destination to a single full-card link with an appropriate subordinate heading, Shopify image, title overlay, and stable no-image fallback; verify each card still navigates to `/collections/<handle>` and no collection-specific copy is synthesized.

## 2. Editorial Responsive Presentation

- [x] 2.1 Add scoped directory surface, introduction, grid, and card styles to `app/styles/tailwind.css` using the existing ivory, beige, nude, brown, gold, ink, Playfair Display, and Inter tokens; verify the new selectors do not depend on generic starter collection selectors or alter product-grid route styles.
- [x] 2.2 Implement the responsive collection grid with stable `3:4` media geometry, two columns on mobile, an intermediate tablet layout, and four columns on wide desktop; verify cards remain aligned and the page has no horizontal overflow at 390px, tablet, and desktop widths.
- [x] 2.3 Add the editorial card treatment with a restrained bottom gradient, readable wrapped titles, small-radius imagery, hover-independent resting state, and bounded hover/focus feedback; verify long titles remain visible and the destination is understandable without hover.
- [x] 2.4 Style the breadcrumb, introduction, previous/load-more controls, and end-of-results state so their spacing, borders, typography, and gold focus treatment match the established storefront language; verify pagination loading and end states do not imply unavailable actions.

## 3. Hydrogen Performance and Accessibility

- [x] 3.1 Preserve Hydrogen `Image` rendering with explicit aspect ratio, meaningful Shopify alt-text fallback, accurate responsive `sizes`, and limited eager loading for the first visible cards; verify image requests and card geometry remain stable during initial render.
- [x] 3.2 Add keyboard, coarse-pointer, and reduced-motion behavior for directory cards and pagination controls; verify visible focus, direct touch activation, no hover-only state, and immediate non-essential motion when `prefers-reduced-motion: reduce` is enabled.
- [x] 3.3 Verify the directory makes no Storefront API, dependency, analytics, cart, account, checkout, or SEO changes beyond the existing `/collections` presentation and collection links.

## 4. Validation

- [x] 4.1 Run `npm run typecheck` and verify the route and existing generated types compile without errors.
- [x] 4.2 Run `npm run lint` and `npm run build` and verify the application passes static checks and produces the Hydrogen production bundle.
- [x] 4.3 Run `npm run dev` and inspect `/collections` with the Playwright CLI at desktop, tablet, and mobile-sized viewports; verify visual hierarchy, card links, pagination, keyboard focus, image fallback behavior, no horizontal overflow, no hydration or console errors, and no failed relevant network requests.
- [x] 4.4 From the redesigned directory, exercise a collection-card navigation and global search, account, bag, and footer controls; verify the existing Shopify-backed destination and global interactions remain functional.
