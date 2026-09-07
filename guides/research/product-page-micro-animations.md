# Singhar by Sidra product-page micro-animations

**Status:** Implemented  
**Date:** 2026-09-07  
**Scope:** Product-page buttons, option controls, gallery, accordions, sticky cart, recommendation cards, and related hover states. The P0 motion contract and the accessibility-focused gallery/zoom refinements are implemented; future color swatches, loading-label feedback, and a gallery crossfade remain intentionally deferred until those product behaviors exist.

## Direction in one sentence

Use quiet, editorial motion: ink and brown for action feedback, gold for selection and focus, short origin-aware transitions for state changes, and restrained image movement that keeps attention on the garment.

## What was inspected

- [Design handoff README](../../singhar-by-sidra-mockup-design/README.md)
- [PDP mockup](../../singhar-by-sidra-mockup-design/project/Singhar%20by%20Sidra%20PDP.dc.html)
- [Product card mockup](../../singhar-by-sidra-mockup-design/project/ProductCard.dc.html)
- [Production product route](../../app/routes/products.$handle.tsx)
- [Production product form](../../app/components/ProductForm.tsx)
- [Production add-to-cart button](../../app/components/AddToCartButton.tsx)
- [Production motion tokens and PDP styles](../../app/styles/tailwind.css)

The design handoff was read as source, as requested by its README; the prototype was not rendered or screenshotted.

## Existing design language to preserve

| Design element | Existing treatment | Motion implication |
| --- | --- | --- |
| Palette | Ivory `#FFFFF5`, beige `#E8DCC8`, gold `#C9A25D`, nude `#D8B8A0`, brown `#8A6A50`, ink `#1A1A1A` | Use brown for hover feedback and gold for selection/focus. Avoid bright flashes, neon feedback, and decorative color cycling. |
| Type | Inter for UI text; Playfair Display for product titles and accordion labels | Keep copy stable. Move an adjacent icon or image child instead of shifting headings. |
| Geometry | Mostly 2px corners, generous whitespace, 3:4 product imagery | Animate within clipped frames; do not scale whole cards or change layout geometry. |
| Existing motion vocabulary | `--motion-ease`, `--motion-ease-in-out`, `--motion-ease-out`, `150ms`, `180ms`, `240ms` | Reuse the existing tokens before adding more durations. Remove PDP one-off `0.18s`, `0.2s`, and `0.35s` values where possible. |
| Prototype behavior | `fadeIn` around 150–180ms, `slideUp` sticky bar at 200ms, 1.7x desktop zoom, smooth mobile gallery scrolling | Keep motion functional and small. Product zoom is the strongest movement and should not be surrounded by extra decoration. |

## Research principles applied

[Emil Kowalski’s Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint) maps `ease-out` to user-initiated entry/exit, `ease-in-out` to in-place movement or morphing, and `ease` to gentle hover/color changes. It also recommends a subtle `scale(0.97)` press response. That maps cleanly to the existing Singhar tokens.

His [CSS transitions lesson](https://animations.dev/learn/css-animations/transitions) recommends explicit transition properties instead of `transition: all`, and notes that CSS transitions are interruptible when users reverse direction quickly. This is useful for pointer hover on product cards and buttons.

[web.dev’s CSS animation guidance](https://web.dev/articles/animations-guide) recommends preferring `transform` and `opacity` for movement and reveal, avoiding layout-triggering properties unless necessary, and using `will-change` cautiously. Use color/border transitions for state feedback and transform/opacity for movement.

For accessibility, [MDN’s `prefers-reduced-motion` reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) describes the preference as a request to remove non-essential movement, including scale and pan. [WCAG 2.2 SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) says interaction-triggered animation should be disableable unless essential. None of the decorative hover, press, panel, or card effects proposed here is essential.

For input modality, [MDN’s media-query guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries) distinguishes hover-capable fine pointers from coarse touch pointers. Decorative hover transforms should therefore be scoped to `@media (hover: hover) and (pointer: fine)`. Click, keyboard focus, and touch still need clear non-hover states.

## Review of the current motion

| Before | After |
| --- | --- |
| PDP CTA transitions use one-off `0.18s ease` values and have no visual `:active` press response. | Reuse the shared motion tokens, keep color feedback around `180ms ease`, and add `scale(0.97)` to the button visual on press for about `130ms ease-out`. |
| `.pdp-recommendation-card:hover img` uses `transform: scale(1.025)` over `0.35s ease` with no fine-pointer guard. | Keep the restrained `1.02–1.025` image reveal, reduce it to roughly `220ms ease`, and scope it to fine hover-capable pointers. Mirror the state for `:focus-visible`. |
| The accordion plus icon rotates over `0.18s ease`; the prototype references `fadeIn`, but production has no matching keyframe. | Use `ease-in-out` for the in-place plus rotation and add a production-owned, short opacity/translate entrance. Do not animate accordion height in the first pass. |
| The sticky cart transitions `transform` over `0.2s ease` but does not animate opacity as the prototype does. | Pair `opacity` and `transform` with the same `ease-out` panel timing, approximately `200–240ms`, and keep visibility delay synchronized. |
| PDP hover selectors are not consistently grouped under a hover-capable pointer query. | Gate image and decorative hover movement with `(hover: hover) and (pointer: fine)`; keep focus and active states independent. |
| The global reduced-motion fallback shortens transitions to `0.01ms`, while the PDP selectors are not explicitly listed in the targeted reduced-motion block. | Add explicit PDP reduced-motion coverage for new animation groups: `animation: none`, `transition: none`, and `transform: none` where the transform is decorative. Keep the content/state visible. |

## Motion map

| Surface | Trigger and purpose | Proposed micro-animation | Timing / easing | Priority |
| --- | --- | --- | --- | --- |
| Add to Cart and sticky Add to Cart | Hover confirms the primary action; press confirms the click | Preserve ink → brown hover. Add a subtle press scale to the button’s visual surface, not its hit area. Do not add a flying product image or bounce. | Hover `180ms ease`; press `120–150ms ease-out` | P0 |
| Add-to-cart pending state | Communicate that the submit was received | If a loading label/spinner is added later, swap text without changing button width. A small linear spinner is acceptable because it represents progress; do not pulse the whole CTA. | `150–200ms ease` for label opacity; progress loop `linear` only | P1 |
| Variant option buttons | Confirm size/color selection without making the option row jump | Transition border/background/text colors. On fine-pointer hover, use a muted beige or brown border. Keep the selected ink fill and `aria-pressed`/`aria-current` as the actual state. Avoid hover scale. | `140–180ms ease`; optional press `120ms ease-out` | P0 |
| Future color swatches | Make the selected swatch unmistakable | Use a gold ring/outline or box-shadow transition around the existing 30px swatch. Keep the swatch size fixed; do not animate the surrounding layout. | `150ms ease-in-out` | P1 |
| Gallery thumbnails | Tie the active thumbnail to the main image | Transition the active border to gold. A tiny image opacity or scale reveal is optional, but do not make the thumbnail row move. The active state must remain visible without motion. | `150ms ease` | P0 |
| Main gallery image | Preserve continuity when a thumbnail changes | Consider a keyed image crossfade with a 1–2px settle, only on explicit thumbnail selection. Let mobile swipe remain native scroll-snap behavior; do not layer a second transition over user-controlled scrolling. | `180–220ms ease-out` | P1 |
| Desktop image zoom | Communicate a real inspection affordance | Keep the existing cursor-following 1.7x zoom as functional behavior. Do not add parallax, rotation, or a spring. Provide a keyboard/focusable path if zoom remains an interactive feature. | Immediate tracking; settle `200ms ease-out` only when leaving | P0 accessibility check |
| Mobile zoom overlay | Preserve spatial continuity into the enlarged image | Enter with overlay opacity plus image `scale(0.98) → 1`; pair overlay and image timings. If exit animation requires keeping the node mounted, do that deliberately; otherwise use a fast/instant exit. | `180–220ms ease-out` | P1 |
| Accordion plus icon | Show expanded/collapsed state | Rotate `+` to `×` by 45 degrees. The icon is already the right idea; change its easing to `ease-in-out` and keep the content state available to assistive technology. | `180ms ease-in-out` | P0 |
| Accordion panel | Make newly revealed details feel attached to the label | Keep the first pass simple: opacity plus a 4px vertical settle on entry. Avoid animating `height`, `padding`, or `margin`; the panel can reflow immediately while its contents reveal gently. | `150–180ms ease-out` | P1 |
| Sticky cart bar | Explain why a purchase action reappeared after scrolling | Slide from the bottom with a matching opacity fade. Keep the bar’s layout fixed and pair the bar’s transform/opacity timing. | `200–240ms ease-out` | P0 |
| Breadcrumb links | Provide low-attention navigation feedback | Transition the text color to gold or brown. A gold underline that grows from the left is acceptable if it does not change layout. | `150ms ease` | P1 |
| Recommendation cards | Make the related item feel tactile without stealing focus | Scale only the image inside its clipped 3:4 frame to about `1.02`; keep title and price still. Apply the same image state on `:focus-visible`. | `200–240ms ease` | P0 |
| Trust badges | Support confidence, not decoration | Keep static. Do not stagger checks, pulse assurance icons, or animate the trust row on every product visit. | None | P0 guardrail |
| Product title and price | Preserve scanability when options change | Keep immediate and stable. Avoid fading or sliding price/title on routine variant changes; this is high-frequency information. | None | P0 guardrail |
| Quick Buy | Mockup-only affordance | Do not add motion or the control until the action exists end to end in the production architecture. | N/A | P0 scope guardrail |

## Recommended motion contract

| Motion job | Existing token / value | Use on the PDP |
| --- | --- | --- |
| Hover color/border | `var(--motion-standard)` + `var(--motion-ease)` | CTA, option borders, breadcrumbs, thumbnails |
| Press feedback | `130ms` + `var(--motion-ease-out)` | CTA, carousel-like controls, compact action buttons |
| In-place movement | `var(--motion-fast)` or `var(--motion-standard)` + `var(--motion-ease-in-out)` | Accordion plus, future swatch ring, gallery dot state |
| Enter/exit | `var(--motion-panel)` + `var(--motion-ease-out)` | Sticky cart, modal, overlay, drawer-like PDP states |
| Image hover | About `220ms` + `var(--motion-ease)` | Recommendation image only; replace current `350ms` one-off |

Avoid adding a spring or bounce in this pass. Springs are better reserved for interruptible gestures or playful, draggable interactions; neither is central to this PDP.

## Three coherent directions

### 1. Quiet editorial — recommended

Use color, border, underline, and the existing palette almost everywhere. Add the press scale to primary buttons, gold selection states, a restrained image reveal, and paired panel transitions. This gives the page polish without competing with fashion imagery.

### 2. Tactile product detail

Keep the quiet foundation, then add a subtle main-image crossfade and a stronger but still small thumbnail state. This makes browsing feel more physical, but it should be tested with real product photography before adoption.

### 3. Expressive commerce feedback

Add pending and success states to Add to Cart, such as `Adding…` then `Added`, while keeping the cart aside as the primary confirmation. This is useful only if it does not duplicate the cart drawer’s feedback or cause the CTA label to jump.

Do not combine direction 3 with a flying-product animation, CTA pulse, automatic gallery motion, or a looping “attention” effect.

## Accessibility and performance guardrails

- Every new non-essential motion group needs an explicit reduced-motion outcome. Remove scale, pan, slide, and crossfade effects rather than merely slowing them down. Keep selected, expanded, active, busy, sold-out, and unavailable states visible through color, border, text, and ARIA state.
- Preserve the existing gold `:focus-visible` outline. [W3C’s Focus Visible guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) requires a visible focus indicator for keyboard-operable controls; hover styling cannot substitute for it.
- Keep the visible gallery dots and any swatches visually delicate, but preserve a usable hit area. [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets 24×24 CSS pixels as the minimum AA target criterion with exceptions; the project’s existing 44px icon-button convention is a good touch-friendly default.
- Keep hover-only movement inside `@media (hover: hover) and (pointer: fine)`. Touch and keyboard users need immediate active/focus feedback without hover transforms.
- Animate only `transform` and `opacity` for movement/reveal. Explicitly list color and border properties for visual state changes; never use `transition: all`.
- Do not animate whole-card geometry, `height`, `padding`, `margin`, or grid columns. Let the layout reflow immediately where content truly expands.
- Do not add `will-change` pre-emptively. Profile first and apply it only to an element that actually benefits.
- Do not add automatic PDP motion: no autoplay gallery, pulsing sticky cart, trust-badge stagger, or recurring product-card shimmer.

## Suggested implementation order

1. Normalize PDP one-off timings to the existing motion tokens.
2. Add CTA and option-button press/hover behavior, keeping hit areas fixed.
3. Gate recommendation image hover and reduce it from 350ms to roughly 220ms; mirror it for keyboard focus.
4. Fix accordion icon easing and add a production-owned panel entrance; decide whether exit remains immediate or requires a mounted transition state.
5. Pair sticky cart opacity/transform timing and add explicit PDP reduced-motion selectors.
6. Consider gallery crossfade or mobile zoom polish only after testing real imagery, keyboard access, and reduced motion.

## Implemented acceptance checklist

- [x] Every implemented animation has a purpose: feedback, orientation, state continuity, or content reveal.
- [x] Hover-only transforms are gated to fine hover-capable pointers.
- [x] Keyboard focus remains visible and is not replaced by hover styling.
- [x] Reduced motion removes the implemented non-essential scale, pan, slide, and reveal effects.
- [x] Routine controls stay around `100–180ms`; PDP panels stay under `300ms`.
- [x] Sticky cart and the mobile zoom overlay use paired timing and easing.
- [x] Product imagery animates inside clipped frames without changing layout.
- [x] Selected, expanded, unavailable, sold-out, busy, and error states remain clear without motion.
- [x] No `transition: all`, bounce, autoplay, pulsing CTA, or flying-product animation is introduced.
- [x] The desktop gallery zoom is keyboard-operable with Enter/Space and Escape.

## Sources

1. [Emil Kowalski — The Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint)
2. [Emil Kowalski — CSS Transitions](https://animations.dev/learn/css-animations/transitions)
3. [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
4. [MDN — Media query fundamentals](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries)
5. [web.dev — How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
6. [W3C — WCAG 2.2 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
7. [W3C — WCAG 2.2 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
8. [W3C — WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
