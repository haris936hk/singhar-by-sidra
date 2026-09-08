# cart-aside-micro-animations Specification

## Purpose

Provide a restrained, accessible success response inside the cart drawer so shoppers can immediately understand that an item was added without changing the cart page experience.

## Requirements

### Requirement: Cart drawer confirms a successful item addition

The cart drawer SHALL visibly show the exact confirmation text `Added to your bag` after a successful add-to-cart action, and the confirmation SHALL be exposed as a polite status update for assistive technology.

#### Scenario: A new product line is added successfully
- **WHEN** an add-to-cart action completes successfully and introduces a new cart line
- **THEN** the open or opening cart drawer SHALL show `Added to your bag`, announce the status politely, and provide a restrained entrance response for the new line

#### Scenario: An existing product line quantity increases
- **WHEN** an add-to-cart action completes successfully and increases the quantity of an existing cart line
- **THEN** the cart drawer SHALL show `Added to your bag`, announce the status politely, and provide restrained feedback on the updated line or quantity without duplicating the line

#### Scenario: The add-to-cart action fails
- **WHEN** an add-to-cart action returns an error or does not produce a usable updated cart
- **THEN** the cart drawer SHALL NOT show a successful-add confirmation or success animation

### Requirement: Cart drawer feedback remains scoped to the aside

Cart-addition confirmation and related micro-animations SHALL apply only to the cart drawer experience and SHALL NOT alter the `/cart` page's layout, content, or motion behavior.

#### Scenario: The cart page renders cart contents
- **WHEN** a shopper views or updates the `/cart` page
- **THEN** the page SHALL continue to render without the `Added to your bag` confirmation or cart-aside success animations

#### Scenario: The cart drawer opens with existing items
- **WHEN** a shopper opens the cart drawer without completing a new add-to-cart action
- **THEN** existing lines SHALL remain stable and SHALL NOT replay entrance or success animations

### Requirement: Cart drawer motion is restrained and preference-aware

Cart drawer micro-animations SHALL use short, bounded transform and opacity motion, SHALL preserve layout geometry, and SHALL be disabled or made immediate when reduced motion is preferred.

#### Scenario: Normal motion is enabled
- **WHEN** the user agent does not request reduced motion
- **THEN** the confirmation, line feedback, and count feedback SHALL remain below 300ms per transition, avoid layout-property animation, and preserve the existing drawer/backdrop timing

#### Scenario: Reduced motion is preferred
- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** the confirmation text and cart state changes SHALL remain visible and understandable while transforms, opacity transitions, pulses, and other non-essential motion are disabled or made immediate

### Requirement: Cart drawer feedback remains usable during interaction

Success feedback SHALL not block focus, keyboard interaction, cart controls, drawer dismissal, or navigation, and the visible confirmation SHALL remain secondary to the cart heading and contents.

#### Scenario: A shopper continues interacting after an add
- **WHEN** the success confirmation is visible
- **THEN** the shopper SHALL be able to change quantity, remove items, close the drawer, or proceed to checkout without waiting for the confirmation to finish

#### Scenario: Multiple add actions occur close together
- **WHEN** more than one successful add-to-cart action completes while a confirmation is active
- **THEN** the drawer SHALL present a coalesced or restarted confirmation without stacking an unbounded queue of messages or animations
