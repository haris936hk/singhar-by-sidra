## Why

The product-grid experiences at `/collections/:handle` and `/collections/all` currently use inconsistent, partly unguarded motion: product-card image hover, sort controls, filter groups, and mobile sheets rely on one-off timings or lack coordinated feedback. A shared micro-animation contract will make both routes feel consistent with Singhar by Sidra's quiet editorial visual language while preserving fast shopping, accessibility, and reduced-motion preferences.

## What Changes

- Establish one collection motion treatment for both product-grid routes, reusing the existing motion tokens and palette.
- Add restrained product-card image hover and keyboard-focus feedback inside the existing clipped media frame without changing card geometry.
- Normalize sort, filter, density, filter-chip, breadcrumb, and pagination control feedback with explicit transitions and subtle press states where appropriate.
- Coordinate mobile filter/sort sheet and backdrop entrance timing, while keeping the current mobile sheet structure and immediate close behavior.
- Refine filter-group and sort-chevron state motion using appropriate in-place easing.
- Add explicit reduced-motion outcomes for every new collection animation and keep all meaningful states available without motion.
- Keep filtering, sorting, density changes, and pagination content updates immediate; do not add grid-wide stagger, automatic motion, bounce, layout-property animation, or motion for mockup-only controls that do not exist in production.

## Capabilities

### New Capabilities

- `collection-micro-animations`: Consistent, accessible micro-animations for product-grid collection browsing across named collections and all-products routes.

### Modified Capabilities

None.

## Impact

- Affects collection product-grid presentation in `app/routes/collections.$handle.tsx` and `app/routes/collections.all.tsx`.
- Affects shared product-card presentation in `app/components/CollectionProductCard.tsx` and collection motion styles in `app/styles/tailwind.css`.
- No Storefront API, Customer Account API, routing, dependency, or data-model changes are expected.
- Browser validation should cover desktop and mobile viewports, fine-pointer hover, touch behavior, keyboard focus, loading/empty/sold-out states, and `prefers-reduced-motion`.
