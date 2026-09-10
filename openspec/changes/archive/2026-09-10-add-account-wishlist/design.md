## Context

See `proposal.md` for the motivation and `specs/account-wishlist/spec.md` for the observable behavior contract.

The existing Hydrogen app already has the required server boundaries: `context.customerAccount` handles Shopify Customer Account API authentication and queries, `context.storefront` handles catalog data, React Router loaders/actions handle server data flow, and the shared cart components use Hydrogen cart primitives. The account parent route is private and supplies authenticated customer data to child routes. The account drawer in `PageLayout.tsx` and the account rail in `account.tsx` currently maintain separate lists of account destinations.

There is no wishlist object or wishlist operation in Shopify's Customer Account API or Storefront API, and the installed Hydrogen project has no wishlist primitive. Shopify's Customer Account API does support customer metafield reads and the authenticated `metafieldsSet` mutation. Shopify's `list.product_reference` metafield type can hold up to 128 product references. The Customer Account API's `MetafieldReference` union does not expose Product, so product references must be read as JSON IDs and resolved with the Storefront API `nodes` query.

The repository has no Shopify app TOML configuration. The Customer metafield definition and Customer Account API permissions are therefore an external store setup prerequisite for this existing Hydrogen storefront, not a new app or deployment configuration to invent in this change.

## Goals / Non-Goals

**Goals:**

- Use Shopify as the only source of truth for an authenticated customer's saved products.
- Keep private customer operations in server-side Hydrogen loaders/actions and preserve the existing session and cache boundaries.
- Make product resolution, product ordering, availability, and cart behavior explicit across the Customer Account API and Storefront API boundary.
- Reuse the existing account shell, storefront product presentation, Hydrogen image/money primitives, and Hydrogen cart flow.
- Make concurrent wishlist updates safe without adding a custom synchronization service.
- Match the approved Wishlist mockup's responsive visual hierarchy while replacing prototype state and hard-coded products with Shopify data.

**Non-Goals:**

- Do not create a native-looking wishlist API abstraction that pretends Shopify provides one.
- Do not use localStorage, cookies, an external wishlist provider, an Admin API bridge, a custom database, or a second customer session.
- Do not support guest wishlists, wishlist sharing, multiple lists, item notes, customer-defined labels, price alerts, back-in-stock alerts, or email automation.
- Do not store selected variants in the wishlist or silently add an arbitrary variant for a multi-variant product.
- Do not add a runtime feature flag or a second configuration system solely to mask an unconfigured Shopify store. Store setup is a release prerequisite; API failures remain safe and visible.

## Decisions

### Use a Shopify Customer list product-reference metafield

The store will define one merchant-owned Customer metafield with namespace `custom`, key `wishlist`, and type `list.product_reference`. Each value is a Shopify Product GID. This is a Shopify-supported data type rather than an application-owned database record, and Shopify automatically removes deleted products from list reference metafields.

The definition must exist before the feature is released. The store must also grant the Customer Account API the documented `customer_read_customers` and `customer_write_customers` scopes for metafield access and have applicable protected customer data access approved. The definition is configured in Shopify's store administration using the store's existing configuration process; this repository does not contain a Shopify app project or `shopify.app.toml`, so the change will not fabricate one.

`list.product_reference` is preferred over a JSON list of arbitrary IDs because Shopify validates the reference type and maintains references when a product is deleted. Product references are preferred over variant references because the mockup represents saved products, while variant choice belongs on the product page.

Alternative considered: use localStorage or a cookie. This would not persist reliably across devices, would not be Shopify customer data, and would violate the requested account-backed behavior.

Alternative considered: use an external wishlist app or Admin API service. This would add an unsupported integration and new credential/data boundaries that are not present in the current Hydrogen architecture.

### Read the metafield through Customer Account API, then resolve products through Storefront API

The wishlist loader will query the authenticated customer for:

- `id`, used as the server-derived metafield owner ID;
- `metafield(namespace: "custom", key: "wishlist")`;
- `jsonValue`, parsed as an array of product GIDs;
- `compareDigest`, retained for a safe subsequent mutation;
- `type`, checked to ensure the configured definition is the expected list product-reference type.

The loader will validate the decoded value as a bounded list of Shopify Product GIDs, remove duplicate IDs while preserving the first occurrence, and call Storefront API `nodes(ids: ...)` with the remaining IDs. The Storefront query will request only the product fields needed by the wishlist card: ID, handle, title, featured image, tags, availability, price range, variant count, and the selected-or-first-available variant needed for a safe single-variant cart action.

The response will be reordered to match the metafield order rather than relying on cross-API node ordering. A null Storefront node will remain associated with its original reference as an unavailable item so the customer can remove a stale or unpublished reference without fabricated product details. The list limit of 128 is within the Storefront API `nodes` input limit of 250, so no custom pagination boundary is needed.

The Customer Account API reference connection will not be used to resolve products because its `MetafieldReference` union does not include Product. Reading `jsonValue` and resolving the product IDs through Storefront API is the compatible cross-API path.

The product lookup is derived from private customer data. Even though product fields are public catalog data, the combined response is personalized and must not use a public cache strategy. The route response remains private/no-store, and the Storefront subrequest will not be assigned a public cache policy.

### Use one server action for idempotent add and remove operations

The wishlist route action will accept only an allow-listed intent (`add` or `remove`) and one product GID. It will authenticate through the existing Customer Account client, query the current customer metafield, derive the owner ID from Shopify's response, and compute the next ordered product-reference list on the server. The submitted owner ID, namespace, current list, and compare digest will never be trusted from browser form data.

The action will call the Customer Account API `metafieldsSet` mutation with one metafield value containing the JSON array of Product GIDs. It will include the configured type when creating the value and include the previously read `compareDigest` when updating it. When no metafield exists, `compareDigest: null` will make creation conditional on the metafield still being absent. The mutation's GraphQL errors and `userErrors` will be handled explicitly.

Adding an existing product is a no-op. Removing a missing product is also a no-op. Successful writes return server-confirmed action data and allow React Router to revalidate the affected route. The wishlist page will not remove an item optimistically. A compare-and-set conflict returns a safe retry message so a newer customer change is not silently overwritten.

Alternative considered: send the complete wishlist from the browser. This would permit tampering with another customer's owner ID or a stale list and could overwrite newer changes. Reading the authoritative state and deriving the owner server-side avoids both problems.

### Keep the account route hierarchy and update both account navigation surfaces

The new `account.wishlist.tsx` route will remain nested under the existing authenticated `account.tsx` layout. The account parent will add Wishlist to its page-title mapping and account rail/mobile menu. The shared `PageLayout.tsx` account drawer will add the same destination so the header account entry point remains consistent with the account page.

The Wishlist child will own its heading because the heading includes the current item count. The existing orders, profile, and addresses loaders/actions remain behaviorally unchanged. Wishlist metadata will identify the private page without introducing public SEO content or a new metadata system.

Alternative considered: create an independent top-level wishlist page. This would bypass the existing authentication boundary and duplicate the account navigation.

### Provide shared save controls and a dedicated wishlist card

The save action must be available outside the Wishlist page or the list can never be populated. A small shared save control will post the product GID to the wishlist route using a same-origin React Router fetcher/form. It will be placed on the existing product card surface and the product detail purchase area, using the product's Shopify ID and an accessible pressed/saved state. It will not call Shopify directly from the browser.

The Wishlist page will use a dedicated card composition rather than making the generic collection card depend on private customer state. The card will reuse the existing visual conventions and Hydrogen `Image` and `Money` components, and will contain:

- a 3:4 product image area with Shopify alt text fallback and any supported product badge;
- a clearly named remove button in the image area, with the product title in its accessible name;
- the Shopify product title and current price;
- a product link to the existing product route;
- a purchase control governed by variant availability.

The collection/search card may render the shared save control only when the wishlist feature has been released with the Shopify prerequisite. It will not display a fake saved state while the server result is pending or failed.

### Do not add an arbitrary variant to the cart

Wishlist records contain product references, not a customer's selected size, color, or other option values. The Storefront product query will therefore return the variant count and a first available variant only for determining presentation.

- A product with one available variant may use the existing Hydrogen cart form and that returned variant ID for Add to Cart.
- A product with multiple variants will use a View options link to the product page and will not add the first available variant implicitly.
- A product with no available variant will show Sold out and disable direct purchase.
- A missing or unavailable Storefront node will show a safe unavailable state and a remove action only.

This preserves Shopify's variant model and the existing cart/checkout handoff. It does not introduce a wishlist-specific cart, quick-buy flow, or variant picker.

### Match the mockup with real states instead of prototype state

The page will translate the wishlist mockup into the existing Tailwind v4 account styling:

- desktop: breadcrumb, 240px account rail, capped content column, four-column product grid, and dark shared footer;
- mobile: breadcrumb, collapsible account navigation, two-column product grid, full-width controls, and the existing mobile footer composition;
- title row: Wishlist heading and item count when products are present;
- empty state: editorial heading, explanatory copy, and a link to collections;
- loading state: pending controls and polite status feedback during route actions or navigation;
- error state: safe alert text for failed load/save/remove operations;
- motion: existing account/product transitions with reduced-motion behavior preserved.

The prototype's demo toggle, hard-coded product names, simulated `Added` timeout, product-photo placeholders, and customer-defined labels will not be carried into the production design. Product swatches will also be omitted unless the Storefront product data already supplies a meaningful supported representation; the wishlist contract does not require invented color data.

### Treat store configuration as a deployment prerequisite

Before enabling the route and navigation, the store owner or deployment operator must:

1. Define `custom.wishlist` on Customer with type `list.product_reference`.
2. Enable the Customer Account API `customer_read_customers` and `customer_write_customers` scopes for Customer metafield access.
3. Confirm any protected customer data approval required by the store's Customer Account API client.
4. Validate the read, add, duplicate-add, remove, compare-conflict, and empty flows against a safe linked store.

An absent metafield value is a valid empty Wishlist, so the application can treat a null value as empty after the configured definition is verified. GraphQL or user errors caused by missing configuration are handled as safe feature errors; the implementation will not replace the Shopify data path with a fallback store. If the prerequisite cannot be met, the route, account links, and save controls are not released.

## Risks / Trade-offs

- [Shopify has no native Wishlist resource] -> Keep the capability explicitly backed by the documented Customer metafield and do not present a second unsupported API abstraction.
- [A customer metafield is a custom data model that requires store setup] -> Make the definition, permissions, and protected-data approval a release prerequisite and omit the feature when they are unavailable.
- [The Customer Account API cannot resolve Product through MetafieldReference] -> Read the supported JSON product IDs and resolve them through Storefront API `nodes` in the same server request.
- [A list metafield is limited to 128 items] -> Use Shopify's bounded list type, display the stored list without inventing pagination, and do not claim support beyond the platform limit.
- [Read-then-write updates can race] -> Send `compareDigest`, use conditional creation with null digest, and return a retry error on conflicts instead of overwriting newer data.
- [A product may be unpublished, deleted, or unavailable in the Storefront API] -> Render no fabricated product details, preserve a removable unavailable reference where possible, and rely on Shopify's automatic cleanup for deleted list references.
- [Product references do not preserve size or color choices] -> Directly add only a single-variant product; send multi-variant products to the PDP for explicit option selection.
- [Wishlist product data is derived from customer-specific IDs] -> Keep route responses private/no-store and avoid public subrequest caching even for catalog fields.
- [Account navigation is duplicated between the account shell and header drawer] -> Update both known navigation surfaces in the same implementation task and verify active/current states on desktop and mobile.
- [Save controls are used on public product pages] -> Keep forms same-origin, allow-list intent and product ID input, derive customer ownership server-side, and preserve the existing login redirect behavior for guests.

## Migration Plan

1. Configure and verify the Shopify Customer metafield and Customer Account API permissions in a safe linked store.
2. Add the Customer Account query and `metafieldsSet` operation, then run Storefront/Customer code generation and type checking.
3. Add the authenticated route/action, account navigation destinations, shared save controls, wishlist cards, and scoped Tailwind styling.
4. Validate authenticated and guest behavior, empty and populated states, add/duplicate/remove actions, API errors, compare conflicts, unavailable products, single-variant cart adds, and multi-variant option links.
5. Validate the account shell, Wishlist page, product surfaces, and cart confirmation at desktop and mobile viewport sizes without exposing customer tokens or public cache headers.
6. Roll back by removing the wishlist route/actions, save controls, navigation entries, and wishlist-specific styling. No customer data migration is needed because existing customers begin with an empty metafield and Shopify owns all saved references.

## References

- [Customer Account API with Hydrogen](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/hydrogen)
- [Customer metafield](https://shopify.dev/docs/api/customer/2026-04/objects/customer)
- [Customer Account API metafields](https://shopify.dev/docs/apps/build/customer-accounts/metafields-in-customer-accounts)
- [Customer `metafieldsSet` mutation](https://shopify.dev/docs/api/customer/2026-04/mutations/metafieldsSet)
- [Metafield data types and list limits](https://shopify.dev/docs/apps/build/metafields/list-of-data-types)
- [Storefront API `nodes` query](https://shopify.dev/docs/api/storefront/2026-04/queries/nodes)
- [Storefront API Product object](https://shopify.dev/docs/api/storefront/2026-04/objects/product)
- [Approved wishlist mockup](../../../singhar-by-sidra-mockup-design/project/Singhar%20by%20Sidra%20Wishlist.dc.html)
