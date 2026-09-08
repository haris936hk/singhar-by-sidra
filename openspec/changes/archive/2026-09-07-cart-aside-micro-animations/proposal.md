## Why

The cart aside already provides the storefront's primary post-add destination, but its current feedback is limited to the drawer opening and the cart contents changing. A restrained success moment would confirm that an item was added while preserving the quiet editorial character of the storefront and keeping the cart page unchanged.

## What Changes

- Add cart-aside-only micro-animations for successful add-to-cart feedback.
- Show the visible confirmation text `Added to your bag` near the cart aside heading.
- Animate newly added lines and quantity increases with short transform/opacity transitions.
- Add a restrained pulse to the cart quantity/count when an item is successfully added.
- Trigger confirmation from an actual add-to-cart result, distinguishing new lines from quantity increases and avoiding false success on failed actions.
- Respect reduced-motion preferences by making confirmation and state changes immediate.
- Keep all new motion scoped to the cart aside; do not change `/cart` page behavior.

## Capabilities

### New Capabilities

- `cart-aside-micro-animations`: Provides accessible, restrained success feedback and state-transition motion for the cart drawer.

### Modified Capabilities

<!-- No existing capability requirements change. The existing collection motion contract remains collection-specific. -->

## Impact

- Affects the cart aside composition in `app/components/PageLayout.tsx`, cart state rendering in `app/components/CartMain.tsx` and `app/components/CartLineItem.tsx`, and add-to-cart coordination in `app/components/AddToCartButton.tsx`.
- Extends cart-aside-scoped rules in `app/styles/tailwind.css` using the existing motion tokens.
- Requires no new dependency, Storefront API operation, route, or cart data model.
- Requires responsive and reduced-motion validation for desktop and mobile drawer states.
