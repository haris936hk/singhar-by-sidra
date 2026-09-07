import type {Route} from './+types/collections.all';
import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables, Pagination} from '@shopify/hydrogen';
import type {AllProductsItemFragment} from 'storefrontapi.generated';
import {CollectionProductCard} from '~/components/CollectionProductCard';
import {siteConfig} from '~/lib/site-config';

export const meta: Route.MetaFunction = () => {
  return [
    {title: `All Products | ${siteConfig.brand.english}`},
    {name: 'description', content: siteConfig.seo.description},
    {
      tagName: 'link',
      rel: 'canonical',
      href: '/collections/all',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {products};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="collection-page all-products-page">
      <div className="collection-breadcrumbs">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">All Products</span>
      </div>

      <section aria-labelledby="all-products-heading" className="collection-hero all-products-hero">
        <div className="collection-hero-copy">
          <span className="all-products-eyebrow">The complete edit</span>
          <h1 id="all-products-heading">All Products</h1>
          <p>
            Explore handcrafted eastern wear, from everyday pret to occasion-ready ensembles.
          </p>
        </div>
      </section>

      <div className="all-products-content">
        <section aria-labelledby="all-products-grid-heading" className="all-products-results">
          <h2 className="sr-only" id="all-products-grid-heading">
            All products
          </h2>
          <Pagination<AllProductsItemFragment> connection={products}>
            {({nodes, isLoading, PreviousLink, NextLink}) => (
              <>
                <PreviousLink className="collection-pagination-previous">
                  {isLoading ? 'Loading…' : <span>↑ Load previous</span>}
                </PreviousLink>
                <div className="collection-product-grid all-products-grid density-4">
                  {nodes.map((product, index) => (
                    <CollectionProductCard
                      key={product.id}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      product={product}
                    />
                  ))}
                </div>
                <div className="collection-pagination">
                  <NextLink className="collection-load-more">
                    {isLoading ? 'Loading…' : 'Load more'}
                  </NextLink>
                  {!products.pageInfo.hasNextPage ? (
                    <span>You&apos;ve reached the end of the collection.</span>
                  ) : null}
                </div>
              </>
            )}
          </Pagination>
        </section>
      </div>
    </div>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment AllProductsMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment AllProductsItem on Product {
    id
    handle
    title
    tags
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...AllProductsMoney
      }
      maxVariantPrice {
        ...AllProductsMoney
      }
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      price {
        ...AllProductsMoney
      }
      compareAtPrice {
        ...AllProductsMoney
      }
      selectedOptions {
        name
        value
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...AllProductsItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
