// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/cart
export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    parentRelationship {
      parent {
        id
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    lineComponents {
      ...CartLine
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

export const CART_MUTATE_FRAGMENT = `#graphql
  fragment MutationMoney on MoneyV2 {
    currencyCode
    amount
  }
  fragment MutationCartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount { ...MutationMoney }
      amountPerQuantity { ...MutationMoney }
      compareAtAmountPerQuantity { ...MutationMoney }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice { ...MutationMoney }
        price { ...MutationMoney }
        requiresShipping
        title
        image { id url altText width height }
        product { handle title id vendor }
        selectedOptions { name value }
      }
    }
    parentRelationship { parent { id } }
  }
  fragment MutationCartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount { ...MutationMoney }
      amountPerQuantity { ...MutationMoney }
      compareAtAmountPerQuantity { ...MutationMoney }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice { ...MutationMoney }
        price { ...MutationMoney }
        requiresShipping
        title
        image { id url altText width height }
        product { handle title id vendor }
        selectedOptions { name value }
      }
    }
    lineComponents { ...MutationCartLine }
  }
  fragment CartApiMutation on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed { ...MutationMoney }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer { id email firstName lastName displayName }
      email
      phone
    }
    lines(first: 100) {
      nodes {
        ...MutationCartLine
        ...MutationCartLineComponent
      }
    }
    cost {
      subtotalAmount { ...MutationMoney }
      totalAmount { ...MutationMoney }
      totalDutyAmount { ...MutationMoney }
      totalTaxAmount { ...MutationMoney }
    }
    note
    attributes { key value }
    discountCodes { code applicable }
  }
` as const;

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
    resource {
      ... on Collection {
        id
        handle
        title
        image {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
    items {
      ...MenuItem
    }
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

export const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;
