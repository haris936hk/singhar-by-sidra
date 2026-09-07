## 1. Establish the shared collection motion foundation

- [x] 1.1 Normalize collection breadcrumbs, toolbar controls, density controls, sort controls, filter controls, chips, clear actions, and pagination feedback to the existing motion tokens with explicit transition properties; verify the targeted stylesheet contains no `transition: all`, layout-property animation, or unnecessary one-off collection durations.
- [x] 1.2 Add fine-pointer guards for decorative hover transforms and preserve the existing gold `:focus-visible` treatment for every collection control; verify touch/coarse-pointer interaction has no hover-dependent behavior and keyboard focus remains visible.

## 2. Add product-card and control micro-interactions

- [x] 2.1 Add restrained product-media hover and keyboard-focus feedback for the shared collection product card, keeping the transform near `scale(1.02)` and the existing 3:4 frame, badge, sold-out overlay, title, price, and card dimensions unchanged; verify behavior at both three-column and four-column desktop densities and the mobile two-column grid.
- [x] 2.2 Add consistent control feedback for filter chips, clear actions, load-more links, breadcrumbs, density buttons, and mobile filter/sort buttons, including subtle press feedback where appropriate without changing hit areas; verify selected, loading, disabled, end-of-results, and empty-result states remain clear without motion.
- [x] 2.3 Normalize filter-group plus rotation and filter-value reveal behavior with in-place or entrance easing while leaving layout height/reflow immediate; verify opening and closing groups does not animate `height`, `padding`, `margin`, or grid columns.

## 3. Coordinate sort menus and mobile sheets

- [x] 3.1 Update the desktop sort-menu entrance to use its top-right origin, short opacity/transform motion, and ease-out timing while preserving the current selected-option and keyboard-navigation behavior; verify focus enters the menu and Escape restores focus to the trigger.
- [x] 3.2 Pair mobile filter/sort sheet translation with backdrop opacity using the shared panel timing and ease-out curve; keep closure immediate for option selection, backdrop press, and Escape, and verify the page becomes interactive as soon as the sheet closes.
- [x] 3.3 Add explicit reduced-motion selectors for product media, control transforms, filter reveals, sort-menu entrances, sheet entrances, backdrop opacity, and icon transitions; verify `prefers-reduced-motion: reduce` removes or makes non-essential motion immediate while all content and semantic states remain visible.

## 4. Validate both product-grid routes

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, and `npm run build`; verify the collection styles and any minimal component changes pass the repository's existing checks.
- [x] 4.2 Run the actual local Hydrogen development command and validate `/collections/<available-handle>` and `/collections/all` at desktop and mobile-sized viewports; verify product hover/focus, toolbar states, sorting, filtering, chips, pagination, sheets, sold-out/empty/loading states, responsive overflow, console errors, and failed network requests.
- [x] 4.3 Repeat the browser validation with keyboard-only interaction, touch/coarse-pointer emulation, and reduced-motion emulation; verify focus is visible and not obscured, hover-only transforms do not appear on touch, sheets remain usable, and no state depends on animation.
