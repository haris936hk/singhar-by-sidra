// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_WISHLIST_QUERY = `#graphql
  query CustomerWishlist($language: LanguageCode) @inContext(language: $language) {
    customer {
      id
      metafield(namespace: "custom", key: "wishlist") {
        id
        type
        jsonValue
        compareDigest
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/metafieldsSet
export const CUSTOMER_WISHLIST_UPDATE_MUTATION = `#graphql
  mutation CustomerWishlistUpdate(
    $language: LanguageCode
    $metafields: [MetafieldsSetInput!]!
  ) @inContext(language: $language) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        type
        value
        compareDigest
      }
      userErrors {
        field
        message
        code
      }
    }
  }
` as const;
