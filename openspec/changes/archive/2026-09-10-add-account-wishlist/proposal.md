## Why

The account experience has a visual wishlist reference, but the Hydrogen storefront has no wishlist route or persistence model. Shopify does not provide a native Wishlist resource, so this change defines the supported customer-account experience using Shopify Customer metafields rather than leaving a non-functional or browser-only wishlist in the account area.

## What Changes

- Add an authenticated `/account/wishlist` page under the existing account layout.
- Persist each customer's saved products in a Shopify Customer metafield using the supported `list.product_reference` type and Customer Account API `metafieldsSet` mutation.
- Resolve saved product references through the Storefront API and render real Shopify product data with existing Hydrogen primitives.
- Add account navigation and product-surface controls for saving, removing, and viewing saved products.
- Reuse the existing Hydrogen cart flow while avoiding direct add-to-cart for products that require variant selection.
- Provide responsive desktop and mobile wishlist layouts aligned with the approved wishlist mockup, including item counts, sold-out and unavailable states, loading/error feedback, and an empty state.
- Keep customer reads and writes server-side, authenticated, compare-and-set safe, and private/no-store.
- Omit guest wishlist persistence, localStorage, cookies, external wishlist services, custom databases, Admin API bridges, hard-coded demo products, customer-defined wishlist labels, and unsupported wishlist API fields.
- Require the Shopify metafield definition and Customer Account API permissions to be configured before exposing the wishlist link; do not render a dead or fabricated wishlist feature when that prerequisite is absent.

## Capabilities

### New Capabilities

- `account-wishlist`: Authenticated customers can save, view, remove, and purchase supported saved Shopify products through a responsive account wishlist.

### Modified Capabilities

None.

## Impact

- Account navigation and page-title mapping in `app/routes/account.tsx`.
- New authenticated wishlist route and server action under `app/routes/account.wishlist.tsx`.
- New Customer Account API query/mutation documents for the customer metafield under `app/graphql/customer-account/`.
- Product save controls and variant-safe cart actions in existing product-card and product-detail surfaces.
- Wishlist-specific responsive styling in `app/styles/tailwind.css`.
- Generated Customer Account and Storefront operation types after code generation.
- Shopify store configuration: a Customer metafield definition of type `list.product_reference`, the documented `customer_read_customers` and `customer_write_customers` Customer Account API scopes, and applicable protected customer data approval. No repository deployment or app configuration file is assumed for this existing Hydrogen storefront.
