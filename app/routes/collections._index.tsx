import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image, Pagination} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {siteConfig} from '~/lib/site-config';

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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections-directory-page">
      <nav
        aria-label="Breadcrumb"
        className="collections-directory-breadcrumbs"
      >
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Collections</span>
      </nav>

      <header className="collections-directory-intro">
        <span className="collections-directory-eyebrow">The Singhar Edit</span>
        <h1>Collections</h1>
        <p>{siteConfig.brand.statement}</p>
      </header>

      <Pagination connection={collections}>
        {({
          hasNextPage,
          hasPreviousPage,
          isLoading,
          nodes,
          NextLink,
          PreviousLink,
        }) => (
          <>
            <section
              aria-label="Available collections"
              className="collections-directory-list"
            >
              <ul className="collections-directory-grid">
                {nodes.map((collection, index) => (
                  <CollectionItem
                    key={collection.id}
                    collection={collection as CollectionFragment}
                    index={index}
                  />
                ))}
              </ul>
            </section>

            <nav
              aria-label="Collections pagination"
              className="collections-directory-pagination"
            >
              {hasPreviousPage ? (
                <PreviousLink className="collections-directory-previous">
                  {isLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      <span aria-hidden="true">↑</span> Load previous
                    </>
                  )}
                </PreviousLink>
              ) : null}
              {hasNextPage ? (
                <NextLink className="collections-directory-load-more">
                  {isLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      Load more <span aria-hidden="true">↓</span>
                    </>
                  )}
                </NextLink>
              ) : (
                <span className="collections-directory-end">
                  You&apos;ve reached the end of the collections.
                </span>
              )}
            </nav>
          </>
        )}
      </Pagination>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <li className="collections-directory-card">
      <Link
        aria-label={`Explore ${collection.title}`}
        className="collections-directory-card-link"
        to={`/collections/${collection.handle}`}
        prefetch="intent"
      >
        <div className="collections-directory-card-media">
          {collection.image ? (
            <Image
              alt={collection.image.altText || collection.title}
              aspectRatio="3/4"
              data={collection.image}
              loading={index < 3 ? 'eager' : 'lazy'}
              sizes="(min-width: 1100px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <span
              aria-hidden="true"
              className="collections-directory-card-placeholder"
            />
          )}
          <span
            aria-hidden="true"
            className="collections-directory-card-shade"
          />
          <span className="collections-directory-card-copy">
            <h2>{collection.title}</h2>
            <span
              aria-hidden="true"
              className="collections-directory-card-arrow"
            >
              Explore
              <span>→</span>
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
