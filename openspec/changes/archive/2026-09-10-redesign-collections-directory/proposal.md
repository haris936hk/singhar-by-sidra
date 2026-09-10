## Why

The `/collections` directory currently uses the Hydrogen starter presentation: a plain heading, square image tiles, and an unstyled pagination link. It does not carry the established Singhar by Sidra editorial language or provide a strong, responsive way to browse the store's collection destinations.

## What Changes

- Redesign only the `/collections` directory route as an editorial collection index.
- Add a restrained introductory heading treatment using the existing brand language.
- Present Shopify collections as responsive `3:4` image-led cards with readable titles, subtle overlays, and accessible interaction states.
- Use a four-column desktop grid, an intermediate tablet layout, and a two-column mobile layout.
- Improve collection-card heading semantics, focus treatment, image fallbacks, and responsive image sizing.
- Style previous and load-more pagination to match the storefront's minimal luxury visual system while preserving cursor-based navigation.
- Preserve the existing global header, footer, collection destinations, Storefront API query, Hydrogen pagination behavior, and link prefetching.
- Leave `/collections/:handle` and `/collections/all` outside the scope of this change.
- Do not add filters, sorting, product controls, new dependencies, or a second content source.

## Capabilities

### New Capabilities

- `collections-directory`: Provide a polished, responsive, and accessible directory of Shopify collection destinations at `/collections`.

### Modified Capabilities

None.

## Impact

- Application files: `app/routes/collections._index.tsx` and the collection-directory section of `app/styles/tailwind.css`.
- Storefront data: the existing collection title, handle, and image fields remain sufficient; no Storefront API operation or schema change is required.
- Hydrogen behavior: continue using the server loader, `Image`, `Link`, `Pagination`, cursor pagination, and intent prefetching.
- UX and accessibility: collection cards become full clickable editorial tiles with semantic headings, meaningful image alternatives, visible keyboard focus, and usable reduced-motion behavior.
- Validation: responsive desktop and mobile browser checks, pagination interaction, image fallback behavior, accessibility states, typecheck, lint, and production build validation.
