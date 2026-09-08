## Context

The existing `Aside` provider controls the cart drawer and already coordinates a transform-based panel transition with an opacity-based backdrop. The cart drawer renders the shared `CartMain` and `CartLineItem` components with an aside layout, while the `/cart` route renders the same components with a page layout. The existing motion tokens provide fast, standard, panel, ease-out, and ease-in-out values.

The product add-to-cart flow opens the cart drawer on button activation, before the cart action has necessarily completed. The cart action returns an updated cart plus errors and warnings, and Hydrogen's optimistic cart can render the pending line. The success message therefore needs a result-aware signal rather than a click-only animation.

## Goals / Non-Goals

**Goals:**

- Provide a visible `Added to your bag` confirmation inside the cart drawer.
- Announce the confirmation politely without requiring motion to understand success.
- Distinguish a newly inserted line from an existing line whose quantity increased.
- Preserve the existing drawer/backdrop transition and keep all micro-motion scoped to the aside.
- Keep the confirmation responsive, interruptible, and compatible with reduced-motion preferences.

**Non-Goals:**

- Changing the `/cart` page or its existing presentation.
- Adding a global toast, confetti, sound, or a product-page success overlay.
- Introducing an animation library, a second cart store, a new API operation, or a new cart data model.
- Adding decorative motion to every cart open or replaying all line entrances.
- Animating layout properties such as height, width, padding, margin, or list position.

## Decisions

### 1. Use a narrow cart-add feedback signal through the existing aside context

The add-to-cart control will report a completed, usable add result to the existing aside coordination layer. The signal will carry enough information to associate the action with the resulting cart state, while the current click behavior continues to open the drawer immediately.

The signal is emitted only after the cart form has completed successfully and the response contains an updated cart without blocking cart errors. Failed actions do not arm the success confirmation.

This is preferred over comparing every cart quantity change because quantity controls inside the drawer would otherwise be misidentified as product additions. It is also preferred over a browser-level custom event or a global cart store because the application already has an `Aside.Provider` boundary and server-owned cart state.

### 2. Reserve a status slot beneath the drawer heading

The drawer heading area will reserve a small secondary line for the confirmation. The visible copy is exactly `Added to your bag`. Reserving the slot avoids header height changes and prevents the cart contents from shifting when the message appears.

The confirmation element will use polite status semantics with atomic announcement behavior. It will remain visually secondary to the heading, close control, and cart contents.

### 3. Animate only the state that changed

The existing drawer and backdrop transitions remain the macro entrance motion. On a successful add:

- A newly inserted line enters with a small upward transform and opacity reveal.
- An existing line whose quantity increased receives a short quantity/line feedback pulse instead of being reinserted.
- The cart quantity/count receives one restrained scale pulse.
- The confirmation enters with a small opacity/vertical reveal, remains visible briefly, and exits quickly.

Existing lines do not replay when the drawer opens, and the change does not introduce a whole-list stagger. Micro-motion uses the existing motion tokens, remains below 300ms per transition, and uses transform/opacity rather than layout properties.

### 4. Coalesce repeated confirmations

If multiple successful additions complete while the message is visible, the drawer will restart or coalesce the same confirmation state instead of creating a queue of messages. Any timer or state subscription used for this lifecycle must clean up when the relevant component unmounts.

### 5. Keep motion CSS-driven and reduced-motion aware

CSS will handle the predetermined transform and opacity transitions. React state is limited to the confirmation lifecycle and one-shot line/count markers; per-frame updates and animation-frame loops are unnecessary.

The cart-aside reduced-motion rule will make the confirmation, line reveal, count pulse, and any related transition immediate while keeping the updated text and cart state visible. Existing focus management, Escape handling, backdrop dismissal, and keyboard interaction remain unchanged.

### 6. Scope by cart layout and validate both drawer sizes

Selectors and state markers will be restricted to the cart aside, using the existing layout distinction rather than shared cart selectors that also affect the page. The behavior must be checked at the mockup's mobile full-width drawer and desktop narrow drawer sizes, including rapid add actions and add failures.

## Risks / Trade-offs

- [Risk] The cart drawer opens before the add action resolves, so the confirmation could appear after the drawer has already settled. -> [Mitigation] Keep the confirmation independent of the panel entrance and trigger it when the successful result is observed; do not delay focus or drawer interaction.
- [Risk] A submitted variant may merge into an existing cart line rather than create a new line. -> [Mitigation] Compare the successful add result with the prior cart snapshot and animate the corresponding quantity/line instead of assuming insertion.
- [Risk] Optimistic rendering and the server result may arrive in different render phases. -> [Mitigation] Keep a one-shot pending feedback marker until the matching line or quantity change is present, then consume it.
- [Risk] A visible transient message could be missed by screen-reader users if it is only animated. -> [Mitigation] Use a polite status announcement and keep the text meaningful when motion is disabled.
- [Risk] Added motion could leak into the cart page because components are shared. -> [Mitigation] Scope styles and markers to the aside layout and include a cart-page regression check.
- [Risk] Repeated adds could make the drawer feel noisy. -> [Mitigation] Use one short confirmation lifecycle and coalesce repeated events rather than stacking animations.

## Migration Plan

This is an additive UI change with no data migration and no Storefront API changes. Implement the feedback signal, drawer status slot, cart-aside motion rules, and validation coverage together. Rollback is a code and stylesheet revert; existing cart behavior remains the fallback if the feedback signal is removed.
