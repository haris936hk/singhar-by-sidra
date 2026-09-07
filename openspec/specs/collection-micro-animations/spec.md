# collection-micro-animations Specification

## Purpose

Provide a consistent, restrained, and accessible motion language for product-grid browsing across named collection pages and the all-products page without slowing shopping or making motion the only way users perceive state.

## Requirements

### Requirement: Product cards provide restrained media feedback

Product cards on both product-grid routes SHALL provide a subtle visual response when a user points to or focuses a product, while keeping the card frame, title, price, badge, and sold-out state in their existing layout positions.

#### Scenario: Fine-pointer hover on an available product
- **WHEN** a user hovers an available product card with a pointer that supports hover and has a fine pointer
- **THEN** only the product media may receive a restrained scale or opacity response of no more than the established editorial range, and the product card's layout dimensions SHALL remain unchanged

#### Scenario: Keyboard focus on a product link
- **WHEN** a product link receives keyboard focus
- **THEN** the existing visible focus treatment SHALL remain visible and the product media MAY mirror the restrained hover response without hiding or moving the product title, price, badge, or availability state

#### Scenario: Coarse pointer interaction
- **WHEN** a user taps or interacts with a product card on a coarse pointer device
- **THEN** hover-only transforms SHALL not be required to communicate the product link, and the card SHALL remain immediately usable without a hover-dependent state

### Requirement: Collection controls provide consistent interaction feedback

Collection breadcrumbs, density controls, sort controls, filter controls, selected-filter chips, clear-filter actions, and pagination controls SHALL use consistent visual feedback for hover, focus, selection, and press states without changing layout geometry.

#### Scenario: User activates a collection control
- **WHEN** a user hovers, focuses, or presses an enabled collection control
- **THEN** the control SHALL provide an explicit color, border, background, icon, or restrained visual press response appropriate to its state, while preserving its hit area and surrounding layout

#### Scenario: A control is disabled, loading, or has no further results
- **WHEN** a pagination control is loading, disabled, or replaced by the end-of-results message
- **THEN** the state SHALL remain clear and SHALL not use motion to imply an action that cannot be performed

#### Scenario: Filter chips are added or removed
- **WHEN** a filter selection creates or removes a chip
- **THEN** the chip group SHALL update without a layout animation or whole-grid transition, and the selected filter state SHALL remain understandable from text, color, border, or control state alone

### Requirement: Collection overlays preserve spatial continuity

Sort menus and mobile filter/sort sheets SHALL use short, origin-aware entrance motion that visually connects the surface to its trigger or edge, and paired backdrops and panels SHALL enter with coordinated timing.

#### Scenario: Desktop sort menu opens
- **WHEN** a user opens the desktop sort menu
- **THEN** the menu SHALL enter from its trigger-side origin using a brief opacity and transform transition, and keyboard focus and the selected option SHALL remain available throughout the interaction

#### Scenario: Mobile filter or sort sheet opens
- **WHEN** a user opens a mobile filter or sort sheet
- **THEN** the sheet SHALL enter from the bottom while the backdrop fades in with matching timing and easing, and the sheet SHALL remain usable by touch and keyboard input

#### Scenario: Collection sheet closes
- **WHEN** a user closes a mobile filter or sort sheet by choosing an option, pressing the backdrop, or pressing Escape
- **THEN** the sheet SHALL stop blocking page interaction immediately after closure, and an exit animation SHALL not delay access to the underlying page

### Requirement: Collection motion respects user preferences and performance constraints

All non-essential collection motion SHALL be removable through the user's reduced-motion preference and SHALL use explicit, bounded properties and timings consistent with the storefront motion contract.

#### Scenario: Reduced motion is preferred
- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** collection hover transforms, press transforms, opacity reveals, sheet entrances, menu entrances, and icon transitions SHALL be disabled or made immediate, while product, filter, sort, pagination, selected, sold-out, and empty states remain visible and understandable

#### Scenario: Normal motion is enabled
- **WHEN** normal motion is enabled
- **THEN** collection UI motion SHALL remain below 300ms, routine control feedback SHALL stay near the existing fast or standard timing, movement and reveals SHALL use transform or opacity, and layout properties SHALL not be animated

#### Scenario: Product-grid data changes
- **WHEN** filtering, sorting, changing grid density, loading another page, or rendering an empty result changes the product-grid content
- **THEN** the content update SHALL remain immediate and SHALL not trigger a page-wide fade, automatic stagger, bounce, or recurring animation
