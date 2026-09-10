## Purpose

Provides authenticated customers with a Shopify-backed place to save products they may want to purchase later, while keeping product availability and purchasing behavior governed by Shopify.

## ADDED Requirements

### Requirement: Authenticated customers can view saved products

The account area SHALL provide a Wishlist page that is available only to an authenticated customer. The page SHALL display the products saved by that customer in the order supplied by the Shopify Customer wishlist metafield, using current storefront product data for each resolvable item. The page SHALL display an accurate count of resolvable saved products and SHALL NOT render hard-coded or fabricated product data.

#### Scenario: Customer has saved products

- **WHEN** an authenticated customer opens the Wishlist page and saved product references resolve through the storefront
- **THEN** the page displays each resolved product with its current image, title, price, product link, and Shopify-reported availability

#### Scenario: Customer has no saved products

- **WHEN** an authenticated customer opens the Wishlist page and the wishlist metafield is empty or absent
- **THEN** the page displays an empty state explaining that saved products appear there and provides a link to browse the storefront

#### Scenario: Saved product cannot be resolved

- **WHEN** a saved product reference is not returned by the storefront product lookup
- **THEN** the page does not invent product details, preserves the customer's remaining resolvable items, and provides a safe way to remove the unavailable reference when possible

#### Scenario: Customer is not authenticated

- **WHEN** an unauthenticated visitor requests the Wishlist page
- **THEN** the visitor is sent through the established Shopify Customer Account login flow instead of receiving wishlist data

### Requirement: Customer can save a product

The storefront SHALL provide a save action on supported product surfaces for authenticated customers. Saving a product SHALL store its Shopify product reference in the customer's wishlist metafield, SHALL preserve existing item order, and SHALL NOT create duplicate references.

#### Scenario: Customer saves a product successfully

- **WHEN** an authenticated customer saves a product that is not already in the wishlist
- **THEN** the product is persisted to that customer's wishlist and the save control reports the server-confirmed saved state

#### Scenario: Customer saves an already-saved product

- **WHEN** an authenticated customer activates the save control for a product already in the wishlist
- **THEN** the wishlist remains unchanged and the control remains in the saved state without creating a duplicate

#### Scenario: Save operation fails

- **WHEN** Shopify returns a GraphQL error or metafield user error while saving a product
- **THEN** the control leaves the product unsaved, exits its pending state, and shows a safe user-visible error without exposing credentials or raw server details

#### Scenario: Guest activates a save control

- **WHEN** an unauthenticated visitor attempts to save a product
- **THEN** the visitor is directed through the established Shopify login flow and no guest wishlist is stored in browser storage or another non-Shopify store

### Requirement: Customer can remove a saved product

The Wishlist page SHALL provide an explicitly named remove action for each resolvable saved product and SHALL update the Shopify wishlist metafield after a successful removal. The item SHALL remain represented until Shopify confirms the mutation, and failed removals SHALL leave the item available for another attempt.

#### Scenario: Customer removes a saved product

- **WHEN** an authenticated customer activates Remove for a saved product and Shopify accepts the update
- **THEN** the product is removed from the refreshed Wishlist page and the item count is updated

#### Scenario: Remove operation is pending

- **WHEN** a customer submits a remove action
- **THEN** the item remains visible, the remove control is disabled or marked busy for that item, and a second conflicting mutation is not submitted for that item

#### Scenario: Remove operation fails

- **WHEN** Shopify returns a GraphQL error or metafield user error while removing a product
- **THEN** the product remains visible, the pending state ends, and the customer receives a safe error message

### Requirement: Wishlist purchase actions respect Shopify variants

Each Wishlist product SHALL link to its Shopify product page. The page SHALL use a Shopify variant only when the product has one variant that is available for sale. Products with multiple variants SHALL direct the customer to choose options on the product page rather than adding an arbitrary variant to the cart. Products without a purchasable variant SHALL present a non-submittable sold-out state.

#### Scenario: Single-variant product is available

- **WHEN** a saved product has exactly one available variant
- **THEN** the Wishlist page provides an add-to-cart action for that returned variant through the existing Shopify cart flow

#### Scenario: Product requires variant selection

- **WHEN** a saved product has more than one variant
- **THEN** the Wishlist page provides a product-page or options action and does not add an implicitly selected variant to the cart

#### Scenario: Product is sold out

- **WHEN** Shopify reports that no variant of a saved product is available for sale
- **THEN** the Wishlist page shows a sold-out status and disables direct add-to-cart for that product

### Requirement: Wishlist navigation and presentation are responsive

The authenticated account navigation SHALL include a current Wishlist destination when the Shopify wishlist capability is configured. The Wishlist page SHALL match the established account visual language, remain usable without horizontal scrolling, and reflow from a desktop account rail and multi-column product grid to a mobile account menu and two-column product grid.

#### Scenario: Customer views Wishlist on desktop

- **WHEN** an authenticated customer opens Wishlist at a desktop viewport
- **THEN** the account rail appears beside the content, Wishlist is visibly marked as the current destination, and saved products use a multi-column grid with readable controls

#### Scenario: Customer views Wishlist on mobile

- **WHEN** an authenticated customer opens Wishlist at a mobile viewport
- **THEN** account navigation collapses into the established mobile presentation, products use a readable two-column layout, and image, remove, link, and purchase controls remain reachable

#### Scenario: Customer views an empty Wishlist

- **WHEN** the wishlist has no resolvable products
- **THEN** the empty state remains visually centered and usable on both desktop and mobile widths without placeholder demo products

### Requirement: Wishlist data remains private and mutation-safe

Wishlist reads and writes SHALL be scoped to the authenticated customer through Shopify's Customer Account API. The storefront SHALL not expose customer credentials or tokens, SHALL not publicly cache personalized wishlist responses, and SHALL handle concurrent metafield updates without silently discarding a newer wishlist state.

#### Scenario: Authenticated wishlist request is served

- **WHEN** a logged-in customer reads or mutates the Wishlist page
- **THEN** the operation uses the established server-side Customer Account integration and the response is private or no-store

#### Scenario: Concurrent wishlist updates occur

- **WHEN** a wishlist mutation is attempted after the stored Shopify metafield has changed
- **THEN** the application detects the stale write, preserves the newer Shopify state, and asks the customer to retry instead of silently overwriting it

#### Scenario: Shopify reports a wishlist error

- **WHEN** the Customer Account API returns a GraphQL error or metafield user error
- **THEN** the application preserves the failed outcome for safe user-visible feedback and does not expose private implementation details

### Requirement: Unsupported wishlist capabilities are not presented

The storefront SHALL require a Shopify Customer metafield of type `list.product_reference` and the required Customer Account API permissions before exposing wishlist navigation or save controls. The storefront SHALL NOT substitute localStorage, cookies, an external wishlist provider, an Admin API bridge, or a custom database when that Shopify capability is unavailable.

#### Scenario: Shopify wishlist metafield is configured

- **WHEN** the required Customer metafield and Customer Account API permissions are available
- **THEN** the authenticated Wishlist page and supported save controls may be exposed

#### Scenario: Shopify wishlist capability is not configured

- **WHEN** the required Customer metafield or Customer Account API permission is unavailable
- **THEN** the storefront omits Wishlist navigation and save controls rather than presenting a non-functional or browser-only wishlist
