import {
  data as remixData,
  Link,
  useLoaderData,
  useNavigation,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/search';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {CUSTOMER_WISHLIST_QUERY} from '~/graphql/customer-account/CustomerWishlistQuery';
import {
  getEmptyRegularSearchResult,
  type RegularSearchReturn,
  type PredictiveSearchReturn,
  getEmptyPredictiveSearchResult,
} from '~/lib/search';
import type {RootLoader} from '~/root';
import {siteConfig} from '~/lib/site-config';
import {getWishlistProductIds, WISHLIST_PRIVATE_HEADERS} from '~/lib/wishlist';
import type {
  RegularSearchQuery,
  PredictiveSearchQuery,
} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data}) => {
  const term = data?.term?.trim();
  return [
    {
      title: term
        ? `Search results for “${term}” | ${siteConfig.brand.english}`
        : `Search | ${siteConfig.brand.english}`,
    },
    {name: 'description', content: siteConfig.seo.description},
  ];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  if (isPredictive) {
    try {
      return await predictiveSearch({request, context});
    } catch (error) {
      console.error(error);
      return {
        type: 'predictive' as const,
        term: String(url.searchParams.get('q') || ''),
        error: 'Search is temporarily unavailable.',
        result: getEmptyPredictiveSearchResult(),
      };
    }
  }

  try {
    const [result, wishlist] = await Promise.all([
      regularSearch({request, context}),
      getWishlistProductIds({
        isLoggedIn: () => context.customerAccount.isLoggedIn(),
        read: () =>
          context.customerAccount.query(CUSTOMER_WISHLIST_QUERY, {
            variables: {language: context.customerAccount.i18n.language},
          }),
      }),
    ]);
    const loaderData = {
      ...result,
      wishlistProductIds: wishlist.productIds,
    };

    return wishlist.isLoggedIn
      ? remixData(loaderData, {headers: WISHLIST_PRIVATE_HEADERS})
      : loaderData;
  } catch (error) {
    console.error(error);
    const term = String(url.searchParams.get('q') || '');
    if (isPredictive) {
      return {
        type: 'predictive' as const,
        term,
        error: 'Search is temporarily unavailable.',
        result: getEmptyPredictiveSearchResult(),
      };
    }
    return {
      type: 'regular' as const,
      term,
      error: 'Search is temporarily unavailable. Please try again in a moment.',
      result: getEmptyRegularSearchResult(),
      wishlistProductIds: [],
    };
  }
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const loaderData = useLoaderData<typeof loader>();
  const {type, term, result, error} = loaderData;
  const navigation = useNavigation();
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (type === 'predictive') return null;
  const wishlistProductIds = loaderData.wishlistProductIds ?? [];

  const menuCollectionCards = (rootData?.header.menu?.items ?? [])
    .flatMap((item) => {
      const candidates = [item, ...(item.items ?? [])];
      return candidates.flatMap((candidate) => {
        const resource = candidate.resource;
        return resource && 'image' in resource && resource.image
          ? [{...resource, image: resource.image}]
          : [];
      });
    })
    .slice(0, 4);
  const collectionCards = menuCollectionCards.length
    ? menuCollectionCards
    : siteConfig.homepage.featuredCollections.map((collection) => ({
        ...collection,
        id: collection.handle,
      }));
  const isLoading = navigation.state !== 'idle';
  const resultCount = result?.total ?? 0;

  return (
    <div aria-busy={isLoading} className="search-page">
      <div className="search-page-inner">
        <nav aria-label="Breadcrumb" className="search-breadcrumbs">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Search</span>
        </nav>

        <section
          aria-labelledby="search-page-heading"
          className="search-page-intro"
        >
          <span className="search-page-eyebrow">The Singhar edit</span>
          <h1 id="search-page-heading">
            {term ? (
              <>
                Search results for <q>{term}</q>
              </>
            ) : (
              'What are you looking for?'
            )}
          </h1>
          <p>
            {term
              ? 'Discover handcrafted pieces selected for your next occasion.'
              : 'Find timeless eastern wear, from everyday pret to occasion-ready detail.'}
          </p>
          <SearchForm className="search-page-form">
            {({inputRef}) => (
              <div className="search-page-form-field">
                <label className="sr-only" htmlFor="search-page-input">
                  Search the store
                </label>
                <input
                  autoComplete="off"
                  defaultValue={term}
                  id="search-page-input"
                  name="q"
                  placeholder="Search the collection..."
                  ref={inputRef}
                  type="search"
                />
                <button className="search-page-submit" type="submit">
                  <SearchIcon />
                  <span>Search</span>
                </button>
              </div>
            )}
          </SearchForm>
          {term ? (
            <div aria-live="polite" className="search-page-summary">
              <span>
                {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Relevance ordered</span>
            </div>
          ) : null}
        </section>

        {isLoading ? <SearchPageLoading /> : null}

        {!isLoading && error ? (
          <div className="search-page-error" role="alert">
            <strong>Search is temporarily unavailable</strong>
            <span>Please try again in a moment.</span>
          </div>
        ) : null}

        {!isLoading && !error && !term ? (
          <SearchResults.Discovery collectionCards={collectionCards} />
        ) : null}

        {!isLoading && !error && term && !resultCount ? (
          <SearchResults.Empty term={term} />
        ) : null}

        {!isLoading && resultCount ? (
          <SearchResults result={result} term={term}>
            {({articles, pages, products, term}) => (
              <div className="search-page-results">
                <SearchResults.Products
                  products={products}
                  term={term}
                  wishlistProductIds={wishlistProductIds}
                />
                <div className="search-page-secondary-results">
                  <SearchResults.Pages pages={pages} term={term} />
                  <SearchResults.Articles articles={articles} term={term} />
                </div>
              </div>
            )}
          </SearchResults>
        ) : null}
      </div>
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </div>
  );
}

function SearchPageLoading() {
  return (
    <div aria-live="polite" className="search-page-loading">
      <span className="sr-only">Loading search results</span>
      {Array.from({length: 8}, (_, index) => (
        <div key={index} />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.5 15.5 4.3 4.3" />
    </svg>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    tags
    trackingParameters
    vendor
    availableForSale
    featuredImage { id altText url width height }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      availableForSale
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
` as const;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    blog { handle }
    trackingParameters
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

/**
 * Regular search fetcher
 */
async function regularSearch({
  request,
  context,
}: Pick<
  Route.LoaderArgs,
  'request' | 'context'
>): Promise<RegularSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 8});
  const term = String(url.searchParams.get('q') || '').trim();

  if (!term) {
    return {type: 'regular', term, result: getEmptyRegularSearchResult()};
  }

  // Search articles, pages, and products for the `q` term
  const {
    errors,
    ...items
  }: {errors?: Array<{message: string}>} & RegularSearchQuery =
    await storefront.query(SEARCH_QUERY, {
      variables: {...variables, term},
    });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc: number, {nodes}: {nodes: Array<unknown>}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}: {message: string}) => message).join(', ')
    : undefined;

  return {type: 'regular', term, error, result: {total, items}};
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

/**
 * Predictive search fetcher
 */
async function predictiveSearch({
  request,
  context,
}: Pick<
  Route.ActionArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {
    predictiveSearch: items,
    errors,
  }: PredictiveSearchQuery & {errors?: Array<{message: string}>} =
    await storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
      },
    });

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}: {message: string}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc: number, item: Array<unknown>) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}
