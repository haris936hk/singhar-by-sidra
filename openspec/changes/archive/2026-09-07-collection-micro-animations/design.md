## Context

See `proposal.md` for the motivation and scope. Both product-grid routes render the shared collection product-card component and use the collection styles in `app/styles/tailwind.css`; their filter and sort controls are route-local but intentionally share the same class-based visual system. The stylesheet already defines `--motion-ease`, `--motion-ease-in-out`, `--motion-ease-out`, and fast, standard, and panel durations.

The current collection styles contain several one-off timings, an unguarded product-image hover transform, a desktop sort-menu entrance, a filter-plus rotation, and a mobile sheet entrance without a coordinated backdrop fade. The established homepage and product-page research guides require explicit transitions, fine-pointer guards for decorative hover motion, transform/opacity-first movement, and explicit reduced-motion behavior.

## Goals / Non-Goals

**Goals:**

- Extend the existing quiet editorial motion language consistently to `/collections/:handle` and `/collections/all`.
- Keep product imagery and control feedback restrained, fast, and stable across desktop, mobile, touch, keyboard, sold-out, loading, and empty states.
- Reuse the existing motion tokens and palette, adding no animation dependency.
- Coordinate desktop sort-menu and mobile sheet entrances while preserving the current focus and immediate-close behavior.
- Make reduced-motion behavior explicit for each new collection animation group.

**Non-Goals:**

- No Storefront API, loader, route, filtering, sorting, pagination, or data-model redesign.
- No page-load or filter-result stagger, whole-grid fade, automatic carousel, bounce, spring, parallax, cursor-following effect, or layout-property animation.
- No Quick Buy, color-swatch, or other mockup-only interaction until its production behavior exists.
- No animated sheet exit that requires delayed unmounting; closing remains immediate.

## Decisions

### Reuse the shared CSS motion contract

Normalize collection one-off timings to the existing motion tokens: `var(--motion-ease)` for gentle color and border feedback, `var(--motion-ease-in-out)` for in-place icon movement, `var(--motion-ease-out)` for entrances, `var(--motion-fast)` for routine controls, `var(--motion-standard)` for standard feedback, and `var(--motion-panel)` for mobile sheet surfaces. Explicitly list transition properties; never use `transition: all`.

Alternative considered: introduce collection-specific durations or a new animation utility. Rejected because the product and homepage guides already establish the correct vocabulary and a second timing system would make cross-page motion inconsistent.

### Animate only the product media child

Keep the existing `overflow: hidden` media frame and animate only its image to a restrained approximately `scale(1.02)` response over roughly 200–240ms. Scope decorative hover transforms to `(hover: hover) and (pointer: fine)` and mirror the visual response for keyboard focus without replacing the existing gold focus outline. Keep title, price, badge, sold-out overlay, and card geometry static.

Alternative considered: scale the entire product card or add a Quick Buy reveal. Rejected because card geometry changes disturb dense grids, and Quick Buy is not a production action yet.

### Use CSS for predetermined states

Implement hover, focus, press, icon, menu, and sheet motion with CSS transitions and keyframes. Use color, border, and background transitions for state feedback; use transform and opacity for movement and reveals. Do not add `will-change` unless later profiling demonstrates a concrete need.

Alternative considered: GSAP, Framer Motion, or React state-driven animation. Rejected because the interactions are predetermined, CSS keeps them interruptible and lightweight, and adding a runtime animation dependency is not justified.

### Keep controls immediate and geometry stable

Add explicit transitions to breadcrumbs, density controls, sort/filter controls, selected chips, clear actions, and pagination. Use a subtle press response only where it improves feedback and does not change the control's layout or intended hit area. Filter-chip insertion/removal, sorting, density changes, pagination, and empty-state updates remain immediate; no card stagger or page-wide transition is introduced.

Alternative considered: animate the grid when results change. Rejected because filtering and sorting are frequent shopping actions, and delayed or staggered results reduce scan speed.

### Pair overlay and panel entrances, keep exits immediate

Use a short origin-aware opacity/transform entrance for the desktop sort menu. For mobile filter and sort sheets, animate the panel from the bottom and fade the backdrop in with matching panel timing and `ease-out`. The sheet is conditionally mounted today, so closing remains immediate rather than adding presence state and delayed unmounting solely for an exit animation.

Alternative considered: add a mounted/exiting state machine for animated closes. Rejected for this pass because immediate access after close is more valuable than a decorative exit and the existing component structure does not require it.

### Make reduced motion an explicit collection contract

Add collection-specific selectors to the targeted reduced-motion rules so new image transforms, icon rotations, menu/sheet entrances, and opacity reveals are disabled or made immediate. Retain color, border, selection, expanded, loading, sold-out, and empty states as static visual or semantic states. The existing global reduced-motion fallback remains a safety net, not the only implementation.

## Risks / Trade-offs

- [Hover behavior may appear on touch devices] -> Scope decorative transforms to fine hover-capable pointers and keep focus, active, and semantic states independent.
- [A scaled product image may visually clip important garment details] -> Keep the scale near 1.02, preserve the clipped frame, and validate against real product photography at both grid densities.
- [Conditional mounting makes sheet exit animation awkward] -> Keep exits immediate and verify that closure removes the blocking overlay before returning interaction to the page.
- [Reduced-motion overrides may miss a newly introduced selector] -> Maintain a selector checklist in the implementation tasks and test with browser reduced-motion emulation.
- [Frequent control animation could make scanning feel noisy] -> Limit motion to short color/border feedback and purposeful state continuity; do not animate routine result updates or every product card on entry.

## Migration Plan

Implement the stylesheet and any minimal component-selector changes behind the existing collection markup, then validate both routes at desktop and mobile sizes. Run lint and typecheck, test keyboard and reduced-motion behavior, and review the resulting diff. Rollback is a simple revert of the collection motion selectors and token usage; no data, API, or persisted state migration is required.

