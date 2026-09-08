## Purpose

Provide a rapid cart-drawer response after adding a product while keeping every displayed price and total authoritative to Shopify's cart calculation.

## ADDED Requirements

### Requirement: Cart drawer shows the confirmed add result without an avoidable refresh wait

After a successful add-to-cart action, the cart drawer SHALL display the resulting cart line, quantity, line prices, and applicable cart totals as soon as the successful Shopify cart response is available, without waiting for a separate background cart refresh to complete.

#### Scenario: A new product is added successfully
- **WHEN** a shopper adds an available product and Shopify returns a usable updated cart
- **THEN** the cart drawer SHALL show the new line and Shopify-confirmed prices immediately after that response is received

#### Scenario: An existing product line is increased
- **WHEN** a shopper adds a variant that already exists in the cart and Shopify returns the updated cart
- **THEN** the drawer SHALL show the merged quantity and Shopify-confirmed line and cart totals without duplicating the line

### Requirement: Pending cart state remains responsive without inventing prices

While an add-to-cart action is pending, the cart drawer SHALL provide immediate visible line and quantity feedback where the submitted product data permits it, but SHALL NOT present client-calculated line prices, subtotals, discounts, taxes, or totals as confirmed values.

#### Scenario: The cart mutation is still pending
- **WHEN** the drawer opens before the add-to-cart response arrives
- **THEN** the pending line and quantity MAY appear immediately, while unconfirmed price and total fields remain clearly pending or unavailable

#### Scenario: The product price differs from the final cart price
- **WHEN** discounts, market pricing, selling plans, cart transforms, or another Shopify cart rule changes the final price
- **THEN** the drawer SHALL display only the returned Shopify-calculated value and SHALL not expose a conflicting client estimate as the confirmed price

### Requirement: Failed additions do not replace the cart with unconfirmed data

If an add-to-cart action returns cart errors, warnings that prevent a usable result, or no usable cart, the cart drawer SHALL preserve the last confirmed cart state, SHALL not show a successful confirmed-price update, and SHALL expose an understandable failure state through the existing cart error behavior.

#### Scenario: Shopify rejects the add
- **WHEN** the add-to-cart response contains a blocking cart error or no usable cart
- **THEN** the drawer SHALL not show the failed line as a confirmed cart line or announce a successful add

#### Scenario: A background cart refresh completes after the add response
- **WHEN** the drawer receives the successful action result and a later cart refresh completes
- **THEN** the drawer SHALL reconcile to the latest confirmed cart without visible duplicate lines, stale totals, or loss of cart controls

### Requirement: Cart-page behavior remains unchanged

The performance optimization SHALL be limited to the cart drawer add flow and SHALL not introduce provisional pricing, add confirmation, or drawer-specific state into the `/cart` page.

#### Scenario: A shopper visits the cart page
- **WHEN** the `/cart` route renders or revalidates
- **THEN** it SHALL continue to display its server-loaded Shopify cart state without the drawer's pending or add-result presentation

#### Scenario: A shopper continues interacting with the drawer
- **WHEN** a confirmed add result is visible
- **THEN** quantity updates, removals, dismissal, navigation, and checkout controls SHALL remain available without waiting for background reconciliation
