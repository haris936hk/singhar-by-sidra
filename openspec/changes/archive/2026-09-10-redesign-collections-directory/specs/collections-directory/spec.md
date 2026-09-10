## Purpose

This capability gives shoppers an editorial, responsive, and accessible way to discover the Shopify collections available from the `/collections` directory without changing the collection shopping routes.

## ADDED Requirements

### Requirement: Editorial collection directory

The `/collections` page SHALL present a clear page introduction and a browsable set of collection destinations using image-led cards that make each collection title and destination understandable.

#### Scenario: Shopper opens the collections directory

- **WHEN** a shopper visits `/collections`
- **THEN** the page shows a collections heading, the existing storefront navigation and footer, and the currently available Shopify collections as distinct destination cards

#### Scenario: Collection has an image

- **WHEN** a Shopify collection includes an image
- **THEN** its card displays that image with meaningful alternative text and its collection title remains readable over the card presentation

#### Scenario: Collection has no image

- **WHEN** a Shopify collection does not include an image
- **THEN** its card still preserves the collection layout, title, and destination without collapsing into an incomplete or unusable tile

### Requirement: Responsive collection presentation

The collections directory SHALL adapt its spacing, card grid, typography, and controls to desktop, tablet, and mobile viewports while preserving the Singhar by Sidra editorial visual language.

#### Scenario: Shopper uses a desktop viewport

- **WHEN** the directory is viewed on a wide desktop viewport
- **THEN** collection cards appear in a spacious multi-column editorial grid with consistent aspect ratios, alignment, and readable titles

#### Scenario: Shopper uses a mobile viewport

- **WHEN** the directory is viewed on a narrow mobile viewport
- **THEN** collection cards reflow into a touch-friendly two-column layout without horizontal page overflow or clipped titles

#### Scenario: Shopper views the page at an intermediate width

- **WHEN** the viewport is between mobile and wide desktop widths
- **THEN** the collection grid and page spacing transition to an intermediate layout without overlapping content or unusable controls

### Requirement: Collection destination navigation

Each collection card SHALL provide a single clear destination to that collection's existing storefront route and SHALL preserve access to all collection pages through the directory's pagination controls.

#### Scenario: Shopper selects a collection card

- **WHEN** a shopper activates a collection card by pointer, touch, or keyboard
- **THEN** the storefront navigates to the corresponding `/collections/<handle>` route

#### Scenario: More collections are available

- **WHEN** the Shopify collection connection has another page of results
- **THEN** the directory exposes a clear load-more control that retrieves the next page without replacing the existing collection destinations

#### Scenario: A previous collection page is available

- **WHEN** the directory is reached with a valid previous-page cursor
- **THEN** the directory exposes a clear control to load the previous page

#### Scenario: No more collection pages are available

- **WHEN** the collection connection has no next page
- **THEN** the directory communicates that the end has been reached and does not imply that another page can be loaded

### Requirement: Accessible and restrained interaction states

Collection cards and pagination controls SHALL remain understandable and usable without hover, shall expose visible keyboard focus, and SHALL use restrained non-essential motion that does not alter layout geometry.

#### Scenario: Shopper navigates by keyboard

- **WHEN** a collection card or pagination control receives keyboard focus
- **THEN** the focused target has a visible focus treatment and its text and destination remain clear

#### Scenario: Shopper uses a coarse pointer

- **WHEN** a shopper interacts with the directory on a touch or other coarse-pointer device
- **THEN** all collection destinations and pagination controls remain directly usable without a hover-only interaction

#### Scenario: Shopper prefers reduced motion

- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** non-essential card and pagination motion is disabled or made immediate while content, focus, and interaction states remain visible

### Requirement: Shopify commerce boundary

The redesign SHALL remain limited to the `/collections` directory presentation and SHALL preserve the existing Shopify-backed behavior of the header, footer, collection routes, product browsing, cart, checkout, customer account, analytics, and SEO surfaces.

#### Scenario: Shopper follows a collection destination

- **WHEN** a shopper leaves the directory through a collection card
- **THEN** the existing Shopify-backed collection route loads with its current product browsing behavior

#### Scenario: Shopper uses global storefront controls

- **WHEN** a shopper uses search, account, bag, footer, or other global storefront controls from the directory
- **THEN** those controls continue to behave as they did before the directory redesign
