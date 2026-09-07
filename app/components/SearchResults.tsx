import {Image, Pagination} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {CollectionProductCard} from '~/components/CollectionProductCard';
import {
  urlWithTrackingParams,
  type RegularSearchReturn,
} from '~/lib/search';
import {siteConfig} from '~/lib/site-config';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

type DiscoveryCollection = {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  };
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Discovery = SearchResultsDiscovery;
SearchResults.Empty = SearchResultsEmpty;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="search-articles-heading"
      className="search-page-result-section search-page-text-results"
    >
      <div className="search-page-result-heading">
        <div>
          <span>From the journal</span>
          <h2 id="search-articles-heading">Articles</h2>
        </div>
      </div>
      <ul className="search-page-link-list">
        {articles.nodes.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <li key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                <span>{article.title}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="search-pages-heading"
      className="search-page-result-section search-page-text-results"
    >
      <div className="search-page-result-heading">
        <div>
          <span>More to discover</span>
          <h2 id="search-pages-heading">On the site</h2>
        </div>
      </div>
      <ul className="search-page-link-list">
        {pages.nodes.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <li key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                <span>{page.title}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="search-products-heading"
      className="search-page-result-section search-products-result"
    >
      <div className="search-page-result-heading">
        <div>
          <span>Shop the results</span>
          <h2 id="search-products-heading">Pieces</h2>
        </div>
      </div>
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => (
          <>
            <PreviousLink className="search-page-pagination-previous">
              {isLoading ? 'Loading…' : '↑ Load previous'}
            </PreviousLink>
            <div className="search-product-grid">
              {nodes.map((product, index) => {
                const productUrl = urlWithTrackingParams({
                  baseUrl: `/products/${product.handle}`,
                  trackingParams: product.trackingParameters,
                  term,
                });

                return (
                  <CollectionProductCard
                    key={product.id}
                    linkTo={productUrl}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    product={product}
                  />
                );
              })}
            </div>
            <div className="search-page-pagination">
              <NextLink className="search-page-load-more">
                {isLoading ? 'Loading…' : 'Load more'}
              </NextLink>
              {!products.pageInfo.hasNextPage ? (
                <span>You&apos;ve reached the end of the results.</span>
              ) : null}
            </div>
          </>
        )}
      </Pagination>
    </section>
  );
}

function SearchResultsDiscovery({
  collectionCards,
}: {
  collectionCards: ReadonlyArray<DiscoveryCollection>;
}) {
  return (
    <section
      aria-labelledby="search-discovery-heading"
      className="search-page-discovery"
    >
      <div className="search-page-discovery-intro">
        <span className="search-page-section-eyebrow">A little inspiration</span>
        <h2 id="search-discovery-heading">Begin with a favourite</h2>
        <p>Explore the edits our community is loving right now.</p>
      </div>

      <div className="search-page-discovery-block">
        <h3>Trending searches</h3>
        <div className="search-page-trending">
          {siteConfig.homepage.trendingSearches.map((searchTerm) => (
            <Link
              key={searchTerm}
              to={`/search?q=${encodeURIComponent(searchTerm)}`}
            >
              {searchTerm}
            </Link>
          ))}
        </div>
      </div>

      <div className="search-page-discovery-block">
        <h3>Shop collections</h3>
        <div className="search-page-collection-grid">
          {collectionCards.map((collection, index) => (
            <Link
              className={`search-page-collection-card search-page-collection-card-${(index % 4) + 1}`}
              key={collection.id}
              prefetch="intent"
              to={`/collections/${collection.handle}`}
            >
              <div className="search-page-collection-media">
                {collection.image ? (
                  <Image
                    alt={collection.image.altText || collection.title}
                    aspectRatio="3/4"
                    data={collection.image}
                    loading="lazy"
                    sizes="(min-width: 768px) 220px, 42vw"
                  />
                ) : (
                  <span aria-hidden="true">The edit</span>
                )}
                <span className="search-page-collection-shade" />
                <span className="search-page-collection-title">
                  {collection.title}
                </span>
              </div>
              {collection.subtitle ? (
                <span className="search-page-collection-subtitle">
                  {collection.subtitle}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchResultsEmpty({term}: {term: string}) {
  return (
    <section aria-live="polite" className="search-page-empty">
      <span className="search-page-section-eyebrow">A quiet moment</span>
      <h2>
        No results for <q>{term}</q>
      </h2>
      <p>Try a different search, or browse our curated edits below.</p>
      <Link className="button button-dark" to="/collections/all">
        Browse all pieces
      </Link>
      <div className="search-page-empty-trending">
        <span>Try searching for</span>
        <div className="search-page-trending">
          {siteConfig.homepage.trendingSearches.slice(0, 3).map((searchTerm) => (
            <Link
              key={searchTerm}
              to={`/search?q=${encodeURIComponent(searchTerm)}`}
            >
              {searchTerm}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
