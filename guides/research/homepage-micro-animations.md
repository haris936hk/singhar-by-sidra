# Singhar by Sidra homepage micro-animations

**Status:** Research and brainstorm draft  
**Date:** 2026-09-07  
**Scope:** Homepage buttons, components, hover states, and the small state transitions opened from the homepage header. No application code was changed for this draft.

## Direction in one sentence

Use restrained, editorial motion: color and underline changes for frequent links, a barely perceptible press response for buttons, small image reveals for commerce cards, and fast origin-aware transitions for menus and panels. Motion should clarify an action or preserve spatial continuity, not compete with the garments or photography.

## What was inspected

The design handoff identifies `Singhar by Sidra Homepage.dc.html` as the primary homepage reference and requires following its imports. The homepage prototype, `ProductCard.dc.html`, `SearchOverlay.dc.html`, `support.js`, and the handoff README were inspected, along with the current production homepage and styling:

- [Mockup handoff README](../../singhar-by-sidra-mockup-design/README.md)
- [Homepage mockup](../../singhar-by-sidra-mockup-design/project/Singhar%20by%20Sidra%20Homepage.dc.html)
- [Product card mockup](../../singhar-by-sidra-mockup-design/project/ProductCard.dc.html)
- [Search overlay mockup](../../singhar-by-sidra-mockup-design/project/SearchOverlay.dc.html)
- [Production homepage route](../../app/routes/_index.tsx)
- [Production motion and design tokens](../../app/styles/tailwind.css)
- [Homepage content and asset configuration](../../app/lib/site-config.ts)

The repository already contains unrelated, uncommitted changes. They were preserved.

## Existing design language to preserve

The homepage has a quiet luxury/eastern-wear direction:

| Design element | Existing treatment | Motion implication |
| --- | --- | --- |
| Color | Ivory `#FFFFF5`, beige `#E8DCC8`, gold `#C9A25D`, nude `#D8B8A0`, brown `#8A6A50`, ink `#1A1A1A` | Use movement sparingly; let gold and brown carry state changes. Avoid bright flashes, gradients that move, or neon feedback. |
| Type | Inter for utility/UI text; Playfair Display for editorial headings and product titles | Keep text stable. Animate an adjacent arrow, underline, or image rather than shifting a whole heading. |
| Geometry | Mostly 2px corners; circular arrow/testimonial controls; generous whitespace | Use small translations and scale changes that do not alter layout or card dimensions. |
| Controls | `.button` has a 46px minimum height; `.icon-button` is 44px square; carousel/testimonial controls are visually 38px | Preserve the visible design. Give small visual controls a larger interactive hit area where needed. |
| Imagery | 3:4 product/collection cards, full-bleed hero/editorial blocks, `overflow: hidden` image containers | A restrained image scale reveal is a natural fit; never pan or zoom the hero on every hover. |
| Interaction tone | The prototype uses a simple `fadeIn`, a muted hover color, smooth carousel scrolling, and a `Quick Buy` affordance on product imagery | Keep the production version simpler: only animate real actions, and do not add a decorative `Quick Buy` control unless the action exists end to end. |

## Research principles applied

Emil Kowalski’s [Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint) describes easing as a major contributor to perceived quality and speed. Its practical mapping is a good fit here: use `ease-out` for user-initiated entry/exit, `ease-in-out` for an element that moves or morphs while remaining on screen, and `ease` for small hover changes such as color, background, or opacity. It also recommends a subtle `scale(0.97)` press response with a 150ms transition. Avoid `ease-in` for UI feedback and reserve `linear` for genuinely constant motion.

The companion [CSS transitions lesson](https://animations.dev/learn/css-animations/transitions) recommends explicit transition properties instead of `all`, notes that CSS transitions are interruptible, and uses approximately 200ms as a useful starting point for simple hover/transform effects. This matters for a storefront: a pointer can leave and re-enter a product card before its first transition finishes.

The working motion vocabulary is therefore:

| Motion job | Default | Homepage use |
| --- | --- | --- |
| Hover or color feedback | `ease`, 140–180ms | Button color, link color, border, underline, image overlay opacity |
| Press feedback | `ease-out`, 120–150ms | `scale(0.97)` on the button’s visual content; never shrink the hit area |
| Enter/exit | `ease-out`, 180–260ms | Search, account, mobile menu, cart aside, mega menu |
| In-place movement/morph | `ease-in-out`, 180–240ms | Chevron rotation, a carousel control’s arrow, a testimonial state if animated |
| Constant progress | `linear` only when semantically constant | Loading shimmer only; not hover, menus, or CTA feedback |
| Spring/bounce | Not recommended for this pass | Reserve for a future gesture or drag interaction; do not make routine shopping controls playful |

These timings follow the invoked web-animation-design guidance that keeps UI motion below 300ms, with larger surfaces allowed toward the slower end. They are starting points, not promises: test the perceived speed at the actual card and panel sizes.

For rendering performance, [web.dev’s CSS animation guidance](https://web.dev/articles/animations-guide) recommends preferring `transform` and `opacity`, avoiding properties that trigger layout or paint, and using `will-change` cautiously rather than pre-emptively on every element. The proposal below uses color/border transitions only for state feedback and uses `transform`/`opacity` for movement and reveal effects.

## Review of the current motion

| Before | After |
| --- | --- |
| `.button` transitions background/color/border for 180ms with `ease`, but has no press response. | Keep the existing 180ms hover treatment and add a subtle `:active` `scale(0.97)` on the visual button, 120–150ms `ease-out`. |
| `.home-product-card:hover img` scales to `1.025` over 350ms and is not scoped to a fine hover-capable pointer. | Reduce the hover to roughly `scale(1.02)` over 200–240ms `ease`, and scope it to `@media (hover: hover) and (pointer: fine)`. |
| The homepage aside overlay fades for 200ms while the panel translates for 280ms; both use `ease`. | Treat overlay and panel as one unit: use the same `ease-out` duration, approximately 220–260ms, and preserve the panel’s direction/origin. |
| `scrollBy({behavior: 'smooth'})` and `html { scroll-behavior: smooth; }` provide animated scrolling. | Keep smooth scrolling for ordinary users, but ensure programmatic carousel scrolling can use `auto` when reduced motion is requested; an explicit JS `behavior: 'smooth'` is not overridden by the CSS preference alone. |
| Testimonial dots are visually 7px and carousel arrows 38px. | Keep their visible sizes, but provide a comfortable hit target—ideally 44px for the small dot controls and icon buttons. WCAG 2.2’s minimum target-size criterion is 24px, while the handoff and existing icon-button system already favor 44px touch targets. |
| A global reduced-motion fallback compresses animation and transition durations to `0.01ms`. | Keep the fallback, but give new motion groups explicit reduced-motion rules with `animation: none` and `transition: none`, and remove transform changes in the reduced state. |

The `350ms` product-image hover is the main place where the current homepage exceeds the micro-interaction budget. The aside timing mismatch is the main place where paired elements may feel like separate systems.

## Brainstorm: homepage motion map

The following ideas are ordered from high-confidence foundation work to optional polish. “Hover” means fine-pointer hover only; click, keyboard focus, and touch must still have clear non-hover states.

| Surface | Trigger and purpose | Proposed micro-animation | Timing / easing | Priority |
| --- | --- | --- | --- | --- |
| Hero `Shop New Arrivals` | Hover communicates the primary path; press confirms activation | Preserve gold-to-brown color transition. On press, scale only the button visual to `0.97`; do not move the hero copy or image. | Hover 160–180ms `ease`; press 130–150ms `ease-out` | P0 |
| Global `.button` family | Shared feedback across newsletter, account, cart, and future homepage actions | Establish one button recipe: explicit `background-color`, `color`, and `border-color` transitions; optional press scale. Keep outline buttons from changing their geometry. | 160–180ms `ease`; press 130–150ms `ease-out` | P0 |
| Header search/account/bag icons | These are frequent controls; motion should confirm without demanding attention | On fine-pointer hover, shift stroke color to brown or gold. On press, use a tiny `scale(0.97)` on the SVG, not the 44px button box. Avoid hamburger-bar morphing for now. | 140–160ms `ease`; press 120–140ms `ease-out` | P0 |
| Desktop navigation links | Reveal affordance without pushing neighboring items | Transition text color to gold and grow a 1px gold underline from `scaleX(0)` to `scaleX(1)` on a child/pseudo-element. Keep the nav item’s layout width fixed. | 150–180ms `ease` | P1 |
| `View All →` links | Point toward the destination and make the arrow feel attached to the link | Keep the text color change; translate the arrow 3–4px inline on hover. If the arrow is text, split it into a child so only the arrow moves. | 150ms `ease` | P1 |
| New Arrivals / Best Sellers carousel arrows | Confirm that a rail will move; disabled states should remain quiet | Hover: border and arrow color move toward ink/gold. Press: visual circle scales to `0.97`. On hover, the chevron may translate 2px in its travel direction; do not animate disabled arrows. | Hover 150ms `ease`; press 130ms `ease-out` | P0 |
| Product cards | Make the image feel tactile while preserving product identity | Scale the image from `1` to `1.02` inside the existing clipped frame. Optionally reveal a real quick-action child from `opacity: 0` / `translateY(4px)` to visible; do not invent a non-functional action. Keep title and price fixed. | 200–240ms `ease`; optional child 180–220ms `ease-out` | P0 for image; P2 for quick action |
| Featured collection cards | Indicate that the whole editorial tile is clickable | Scale the image to `1.02`; gently strengthen or soften the existing bottom shade and move the title/subtitle by at most 2px. The tile itself must not scale, because that would disturb the grid. Apply the same visual state for `:focus-visible`. | 220–240ms `ease` | P1 |
| Editorial banner | Give the “Explore the Edit” treatment a quiet sense of depth | Scale the image or background media to `1.015–1.02`; animate the underline width or a 2–3px arrow if one is added. Keep the copy centered and stable. | 220–260ms `ease` | P1 |
| Size Guide tile | Make the fit-help destination discoverable without looking like a promo ad | Use the same image reveal as the editorial banner, plus a gold underline that expands beneath “View Size Guide.” Do not animate the two-column layout or the tile height. | 200–240ms `ease` | P1 |
| Testimonial previous/next controls | Give immediate feedback to a low-frequency control | Use border/color change and a 2px arrow nudge on hover; press the visual circle to `0.97`. Keep the quote update immediate unless a robust crossfade can preserve the existing `aria-live` behavior. | Hover 150ms `ease`; press 130ms `ease-out` | P1 |
| Testimonial dots | Show the active position, not decoration | Keep the active gold dot. A small active-state `scale(1.2)` is optional, but the visual dot should sit inside a larger 44px button hit area and the state must also be conveyed by `aria-pressed`. | 140–160ms `ease-in-out` if used | P1 |
| Newsletter input and Subscribe | Make focus and submit status legible | Keep the existing gold focus ring; transition the input border color. Give Subscribe the shared button press response. On successful submission, fade/scale a check or success label in place rather than animating the form height. | Focus 150ms `ease`; success 180–220ms `ease-out` | P1 |
| Search discovery chips | Provide a compact selected/hover state | Transition border/background/text colors only. Avoid chip scaling because many chips can be present and the changing geometry makes the group feel noisy. | 140–160ms `ease` | P1 |
| Search, account, cart, and mobile-menu panels | Preserve spatial relationship with the trigger | Overlay opacity and panel transform should enter together. Search can use a small top-origin `translateY(-6px)` plus opacity; cart/mobile menu can slide from their edge; account can use `transform-origin: top right` with a short scale/translate. | 220–260ms `ease-out`; same timing for paired overlay/panel | P0 for consistency |
| Desktop mega menu | Tie the panel to the nav item that opened it | Use an origin-aware top-edge reveal: `opacity: 0` + `translateY(-6px)` + `scale(0.99)` to settled. Do not animate height, padding, or the entire header. Keep the panel mounted long enough to complete its exit. | 180–220ms `ease-out` | P1 |
| Loading skeletons | Communicate that content is actively loading | Keep the existing shimmer as the only continuous motion and use `linear` because the highlight travels at constant speed. In reduced motion, freeze to a neutral placeholder rather than replacing it with another animation. | Existing 1.2s `linear` loop; no new shimmer | P0 guardrail |
| Instagram grid / WhatsApp contact action | Signal external or secondary destinations without competing with shopping | Instagram tiles can use the same `1.02` image reveal if imagery is present. WhatsApp can use color and a restrained `scale(1.02)` on fine-pointer hover; no pulsing attention loop. | 180–220ms `ease` | P2 |

## Three coherent directions to test

These are alternative levels of expressiveness, not three systems to ship at once.

### 1. Quiet editorial — recommended default

Use color, border, underline, and `scale(0.97)` press feedback almost everywhere. Add `scale(1.02)` only to product, collection, editorial, size-guide, and Instagram imagery. This best protects the ivory/beige/gold palette and keeps shopping fast.

### 2. Editorial reveal

Keep the quiet foundation, then add coordinated child reveals on collection/editorial cards: image scale, shade opacity, and a 2px title lift. This creates a more fashion-magazine feel while keeping the tile frame fixed.

### 3. Expressive navigation

Keep homepage content quiet, but give search/account/cart/mobile-menu panels more spatial continuity with origin-aware entry and exit. This is the best place for slightly stronger motion because it explains a state change and is used less often than the header’s individual controls.

Do not combine expressive navigation with a hero parallax, automatic carousel, cursor-following effects, or large hover scales. Those effects would compete with the same visual hierarchy the mockup establishes.

## Accessibility and input rules

The [MDN `prefers-reduced-motion` reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) describes the media feature as the way to detect a user preference for minimizing non-essential motion, including scaling and panning that can trigger discomfort. [WCAG 2.2 Success Criterion 2.3.3](https://www.w3.org/TR/WCAG22/#animation-from-interactions) says interaction-triggered motion should be disableable unless it is essential. For this homepage, none of the proposed hover or entrance effects is essential, so reduced motion should remove them rather than merely making them slower.

The production stylesheet already contains a global reduced-motion rule and a gold `:focus-visible` outline. New homepage motion should add deliberate component-level coverage:

```css
@media (prefers-reduced-motion: reduce) {
  .home-product-card img,
  .collection-grid img,
  .editorial-banner img,
  .size-guide img,
  .overlay,
  .aside-panel,
  .home-motion-child {
    animation: none;
    transition: none;
    transform: none;
  }
}
```

The exact selectors are implementation details for a later code change; the principle is that every new animated group has an explicit reduced-motion outcome. Keep content visible and stateful. Do not use a motion effect as the only indication that a product is selected, a testimonial is active, a form succeeded, or a menu is open.

For input modality, [MDN’s media-query guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries) distinguishes hover capability from touch and describes fine pointers such as a mouse or trackpad versus coarse pointers such as a finger. [Emil’s transitions lesson](https://animations.dev/learn/css-animations/transitions) makes the same storefront-relevant point: a touch tap can trigger a hover state accidentally. Scope decorative hover transforms to:

```css
@media (hover: hover) and (pointer: fine) {
  /* image reveals, arrow nudges, tile hover states */
}
```

Touch and keyboard users should still receive an immediate pressed/focused state through `:active` and `:focus-visible`. [WAI’s Focus Visible guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) requires a visible keyboard focus indicator, and [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) requires that author-created content does not completely hide the focused component. This is especially important when a search, account, mobile-menu, or cart panel opens over the homepage: keep focus management and the existing focus trap intact, and do not let an entering panel obscure the focused control without moving focus into the panel.

Keep the small visible testimonial dots inside larger buttons. WCAG 2.2 defines 24px as the AA minimum target size in [Success Criterion 2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum); the project’s existing 44px icon-button convention is a better touch-friendly target for compact controls. The visible dot or circle can remain visually delicate while the button’s hit area remains usable.

## Performance guardrails

- Prefer CSS transitions for these predetermined hover, press, and panel states. The homepage already uses CSS and React state; no animation library is needed for this draft.
- Animate `transform` and `opacity` for movement/reveal. Explicitly list color and border properties for gentle state changes; do not use `transition: all`.
- Do not animate width, height, margin, padding, top, or left to open cards, menus, or banners. Use a transform-based visual child or a clipped wrapper instead.
- Do not add `will-change` globally. Use it only when profiling identifies a real issue and remove it when the animation is not imminent, consistent with [web.dev’s caution](https://web.dev/articles/animations-guide).
- Keep the hero image static after load. It is an LCP candidate and the mockup’s visual anchor; a pan/zoom would spend motion budget where there is no user action.
- Do not autoplay a testimonial carousel, product rail, announcement strip, or Instagram motion loop. The announcement is high-frequency information and the rails are user-controlled.
- Keep the existing `scroll-snap-type` rails. For arrow-triggered scrolling, honor reduced motion in the code path because an explicit `behavior: 'smooth'` request is a JavaScript animation. The platform’s [scroll API](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo) documents `smooth` and `instant` as separate behavior values.
- Do not use blur as a default fix. If a future panel transition genuinely needs a blur, keep it subtle and profile it; the proposed effects do not require filters.

## Suggested implementation order for a future code task

1. Add shared motion tokens and component-level reduced-motion coverage in `app/styles/tailwind.css`.
2. Add button press feedback, icon press feedback, and fine-pointer guards around image/card hover rules.
3. Tune the existing product-image hover from 350ms to the 200–240ms range.
4. Add arrow/link/underline micro-interactions without changing layout geometry.
5. Align overlay/panel timing and add the origin-aware mega-menu transition while preserving focus behavior.
6. Add collection/editorial/size-guide image reveals and test them on real product photography.
7. Consider testimonial success/crossfade polish only after verifying `aria-live`, focus, and immediate state updates.

## Acceptance checklist

- [ ] Every animation has a stated purpose: feedback, orientation, state continuity, or content reveal.
- [ ] Hover-only motion is inside `(hover: hover) and (pointer: fine)`.
- [ ] Keyboard focus remains visible with the existing gold focus treatment.
- [ ] Reduced motion removes or replaces every non-essential transition and animation.
- [ ] New UI motion stays below 300ms; routine controls stay closer to 100–180ms.
- [ ] Paired overlay/panel elements enter and exit with matching timing and easing.
- [ ] Product/collection image motion stays inside `overflow: hidden` and does not change layout.
- [ ] No `transition: all`, layout-property animation, automatic carousel, hero parallax, or cursor-following effect is introduced.
- [ ] Compact dots retain an accessible hit target even if their visible mark remains 7px.
- [ ] Desktop fine-pointer, mobile touch, keyboard navigation, loading, disabled, sold-out, and reduced-motion states are checked before shipping.

## Sources

Primary/high-trust sources used for the motion recommendations:

1. [Emil Kowalski — The Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint): easing by interaction type, perceived speed, `ease-out` responsiveness, `ease-in-out` in-place movement, `ease` for hover, `ease-in` avoidance, and the subtle `scale(0.97)` press response.
2. [Emil Kowalski — CSS Transitions](https://animations.dev/learn/css-animations/transitions): explicit transition properties, interruptible CSS transitions, simple 200ms transform examples, and disabling hover effects on touch devices.
3. [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): detecting a user preference to reduce non-essential motion and recognizing scale/pan as possible vestibular triggers.
4. [MDN — Media query fundamentals](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries): `hover` capability and fine/coarse pointer distinctions.
5. [web.dev — How to create high-performance CSS animations](https://web.dev/articles/animations-guide): transform/opacity-first animation and cautious use of `will-change`.
6. [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/): Animation from Interactions, Target Size (Minimum), and the normative accessibility context.
7. [WAI — Understanding Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) and [Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): visible keyboard focus and panel/overlay behavior.
8. [MDN — `Window.scrollTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo): the platform’s `smooth` versus `instant` scroll behavior values.

