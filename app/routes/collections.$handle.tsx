import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  data as remixData,
  Link,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router';
import {Analytics, getPaginationVariables, Pagination} from '@shopify/hydrogen';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import type {
  CollectionProductFragment,
  CollectionQuery,
} from 'storefrontapi.generated';
import type {Route} from './+types/collections.$handle';
import {CollectionProductCard} from '~/components/CollectionProductCard';
import {CUSTOMER_WISHLIST_QUERY} from '~/graphql/customer-account/CustomerWishlistQuery';
import {
  COLLECTION_SORT_OPTIONS,
  filterKey,
  getCollectionSort,
  getCollectionSortVariables,
  normalizeCollectionFilterInput,
  parseCollectionFilters,
  PRICE_FILTER_OPTIONS,
  updateCollectionSearchParams,
  type CollectionSortValue,
} from '~/lib/collectionFilters';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {siteConfig} from '~/lib/site-config';
import {getWishlistProductIds, WISHLIST_PRIVATE_HEADERS} from '~/lib/wishlist';

type CollectionData = NonNullable<CollectionQuery['collection']>;
type CollectionFilter = CollectionData['products']['filters'][number];

export const meta: Route.MetaFunction = ({data}) => {
  const collection = data?.collection;
  const title = collection?.seo?.title || collection?.title;
  const description = collection?.seo?.description || collection?.description;
  return [
    {title: title ? `${title} | Singhar by Sidra` : siteConfig.seo.title},
    ...(description ? [{name: 'description', content: description}] : []),
    {
      tagName: 'link',
      rel: 'canonical',
      href: `/collections/${collection?.handle ?? ''}`,
    },
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw redirect('/collections');

  const url = new URL(request.url);
  const sort = getCollectionSort(url.searchParams.get('sort'));
  const filters = parseCollectionFilters(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 8});
  const {sortKey, reverse} = getCollectionSortVariables(sort);
  const [{collection}, wishlist] = await Promise.all([
    context.storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        filters,
        sortKey,
        reverse,
        ...paginationVariables,
      },
    }),
    getWishlistProductIds({
      isLoggedIn: () => context.customerAccount.isLoggedIn(),
      read: () =>
        context.customerAccount.query(CUSTOMER_WISHLIST_QUERY, {
          variables: {language: context.customerAccount.i18n.language},
        }),
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const loaderData = {
    collection,
    collectionFilters: ensurePriceFilter(collection.products.filters),
    filters,
    wishlistProductIds: wishlist.productIds,
    sort,
  };

  return wishlist.isLoggedIn
    ? remixData(loaderData, {headers: WISHLIST_PRIVATE_HEADERS})
    : loaderData;
}

export default function Collection() {
  const {
    collection,
    collectionFilters,
    filters: activeFilters,
    sort,
    wishlistProductIds,
  } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const [gridDensity, setGridDensity] = useState<3 | 4>(4);
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);

  useEffect(() => {
    if (!sheet) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheet(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [sheet]);

  const activeFilterKeys = useMemo(
    () => new Set(activeFilters.map((filter) => filterKey(filter))),
    [activeFilters],
  );
  const selectedChips = useMemo(
    () => getSelectedChips(collectionFilters, activeFilterKeys),
    [activeFilterKeys, collectionFilters],
  );

  function navigateWithFilters(nextFilters: ProductFilter[]) {
    const search = updateCollectionSearchParams(
      new URLSearchParams(location.search),
      {
        filters: nextFilters,
      },
    );
    setSheet(null);
    void navigate(
      `${location.pathname}${search.toString() ? `?${search}` : ''}`,
    );
  }

  function toggleFilter(input: ProductFilter) {
    const key = filterKey(input);
    const nextFilters = activeFilterKeys.has(key)
      ? activeFilters.filter((filter) => filterKey(filter) !== key)
      : [...activeFilters, input];
    navigateWithFilters(nextFilters);
  }

  function setSort(nextSort: CollectionSortValue) {
    const search = updateCollectionSearchParams(
      new URLSearchParams(location.search),
      {
        sort: nextSort,
      },
    );
    setSheet(null);
    void navigate(
      `${location.pathname}${search.toString() ? `?${search}` : ''}`,
    );
  }

  const clearFilters = () => navigateWithFilters([]);

  return (
    <div className="collection-page">
      <div className="collection-breadcrumbs">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>{collection.title}</span>
      </div>

      <section className="collection-hero">
        <div className="collection-hero-copy">
          <h1>{collection.title}</h1>
          {collection.description ? <p>{collection.description}</p> : null}
        </div>
      </section>

      <div className="collection-toolbar">
        <span className="collection-result-count">
          {collection.products.nodes.length}{' '}
          {collection.products.nodes.length === 1 ? 'product' : 'products'}
        </span>
        <div className="collection-toolbar-actions">
          <div
            aria-label="Product grid density"
            className="collection-density"
            role="group"
          >
            <button
              aria-pressed={gridDensity === 3}
              className={gridDensity === 3 ? 'is-active' : ''}
              onClick={() => setGridDensity(3)}
              type="button"
            >
              <GridDensityIcon columns={3} />
              <span className="sr-only">Three columns</span>
            </button>
            <button
              aria-pressed={gridDensity === 4}
              className={gridDensity === 4 ? 'is-active' : ''}
              onClick={() => setGridDensity(4)}
              type="button"
            >
              <GridDensityIcon columns={4} />
              <span className="sr-only">Four columns</span>
            </button>
          </div>
          <SortDropdown onChange={setSort} value={sort} />
          <button
            className="collection-mobile-control"
            onClick={() => setSheet('sort')}
            type="button"
          >
            Sort
          </button>
          <button
            className="collection-mobile-control"
            onClick={() => setSheet('filter')}
            type="button"
          >
            Filter{selectedChips.length ? ` (${selectedChips.length})` : ''}
          </button>
        </div>
      </div>

      <div className="collection-content">
        <aside
          aria-label="Collection filters"
          className="collection-filter-sidebar"
        >
          <FilterPanel
            filters={collectionFilters}
            onToggle={toggleFilter}
            selectedKeys={activeFilterKeys}
          />
        </aside>

        <section
          aria-label={`${collection.title} products`}
          className="collection-results"
        >
          {selectedChips.length ? (
            <div className="collection-chips">
              {selectedChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => toggleFilter(chip.input)}
                  type="button"
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button
                className="collection-clear"
                onClick={clearFilters}
                type="button"
              >
                Clear All
              </button>
            </div>
          ) : null}

          <Pagination connection={collection.products}>
            {({nodes, isLoading, PreviousLink, NextLink}) => (
              <>
                <PreviousLink className="collection-pagination-previous">
                  {isLoading ? 'Loading…' : '↑ Load previous'}
                </PreviousLink>
                {nodes.length ? (
                  <div
                    className={`collection-product-grid density-${gridDensity}`}
                  >
                    {nodes.map((product, index) => (
                      <CollectionProductCard
                        key={product.id}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        initialSaved={wishlistProductIds.includes(product.id)}
                        product={product as CollectionProductFragment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="collection-empty">
                    <h2>No pieces found</h2>
                    <p>Try clearing a filter to see more of the collection.</p>
                    {selectedChips.length ? (
                      <button onClick={clearFilters} type="button">
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                )}
                <div className="collection-pagination">
                  <NextLink className="collection-load-more">
                    {isLoading ? 'Loading…' : 'Load More'}
                  </NextLink>
                  {!collection.products.pageInfo.hasNextPage ? (
                    <span>You&apos;ve reached the end of the collection.</span>
                  ) : null}
                </div>
              </>
            )}
          </Pagination>
        </section>
      </div>

      {sheet ? (
        <div aria-modal="true" className="collection-sheet-wrap" role="dialog">
          <button
            aria-label="Close panel"
            className="collection-sheet-backdrop"
            onClick={() => setSheet(null)}
            type="button"
          />
          <div className="collection-sheet">
            <span aria-hidden="true" className="collection-sheet-handle" />
            {sheet === 'sort' ? (
              <div className="collection-sort-sheet">
                <h2>Sort By</h2>
                {COLLECTION_SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    type="button"
                  >
                    {option.label}
                    <span aria-hidden="true">
                      {sort === option.value ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="collection-filter-sheet">
                <div className="collection-sheet-heading">
                  <h2>Filters</h2>
                  <button onClick={clearFilters} type="button">
                    Clear All
                  </button>
                </div>
                <div className="collection-sheet-scroll">
                  <FilterPanel
                    filters={collectionFilters}
                    onToggle={toggleFilter}
                    selectedKeys={activeFilterKeys}
                  />
                </div>
                <button
                  className="button button-dark collection-sheet-apply"
                  onClick={() => setSheet(null)}
                  type="button"
                >
                  Show {collection.products.nodes.length} Results
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {siteConfig.marketing.whatsappUrl ? (
        <a
          aria-label="Chat with Singhar by Sidra on WhatsApp"
          className="collection-whatsapp"
          href={siteConfig.marketing.whatsappUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          chat
        </a>
      ) : null}

      <Analytics.CollectionView
        data={{collection: {id: collection.id, handle: collection.handle}}}
      />
    </div>
  );
}

function GridDensityIcon({columns}: {columns: 3 | 4}) {
  return (
    <span
      aria-hidden="true"
      className={`collection-density-icon collection-density-icon-${columns}`}
    >
      {Array.from({length: columns * 2}, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
}

function SortDropdown({
  onChange,
  value,
}: {
  onChange: (value: CollectionSortValue) => void;
  value: CollectionSortValue;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(
    COLLECTION_SORT_OPTIONS.findIndex((option) => option.value === value),
    0,
  );
  const selectedOption = COLLECTION_SORT_OPTIONS[selectedIndex];

  useEffect(() => {
    if (!open) return;
    optionRefs.current[selectedIndex]?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, selectedIndex]);

  function focusOption(index: number) {
    const optionCount = COLLECTION_SORT_OPTIONS.length;
    optionRefs.current[(index + optionCount) % optionCount]?.focus();
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(COLLECTION_SORT_OPTIONS.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div
      className={`collection-sort-select${open ? ' is-open' : ''}`}
      onBlur={(event) => {
        if (
          !event.relatedTarget ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      ref={dropdownRef}
    >
      <button
        aria-controls="collection-sort-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="collection-sort-trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span>Sort By: {selectedOption.label}</span>
        <span aria-hidden="true" className="collection-sort-chevron" />
      </button>
      {open ? (
        <div
          className="collection-sort-menu"
          id="collection-sort-menu"
          role="menu"
        >
          {COLLECTION_SORT_OPTIONS.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                aria-checked={selected}
                className={selected ? 'is-active' : ''}
                key={option.value}
                onClick={() => {
                  setOpen(false);
                  onChange(option.value);
                }}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="menuitemradio"
                type="button"
              >
                <span>{option.label}</span>
                <span aria-hidden="true">{selected ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FilterPanel({
  filters,
  onToggle,
  selectedKeys,
}: {
  filters: CollectionFilter[];
  onToggle: (input: ProductFilter) => void;
  selectedKeys: Set<string>;
}) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(filters.slice(0, 2).map((filter) => filter.id)),
  );

  return (
    <div className="collection-filter-groups">
      {filters.map((filter) => {
        const open = openGroups.has(filter.id);
        const swatches = filter.presentation === 'SWATCH';
        const values = getFilterValues(filter);
        return (
          <div className="collection-filter-group" key={filter.id}>
            <button
              aria-expanded={open}
              className="collection-filter-heading"
              onClick={() =>
                setOpenGroups((current) => {
                  const next = new Set(current);
                  if (next.has(filter.id)) next.delete(filter.id);
                  else next.add(filter.id);
                  return next;
                })
              }
              type="button"
            >
              <span>{filter.label}</span>
              <span aria-hidden="true" className={open ? 'is-open' : ''}>
                +
              </span>
            </button>
            {open ? (
              <div
                className={
                  swatches
                    ? 'collection-filter-values swatches'
                    : 'collection-filter-values'
                }
              >
                {values.map((value) => {
                  const input = normalizeCollectionFilterInput(value.input);
                  const selected = input
                    ? selectedKeys.has(filterKey(input))
                    : false;
                  const swatch = 'swatch' in value ? value.swatch : null;
                  const swatchImage = swatch?.image?.previewImage?.url;
                  if (!input) return null;
                  return (
                    <button
                      aria-pressed={selected}
                      className={
                        swatches
                          ? 'collection-filter-swatch'
                          : 'collection-filter-value'
                      }
                      key={value.id}
                      onClick={() => onToggle(input)}
                      type="button"
                    >
                      {swatches ? (
                        <span
                          aria-label={value.label}
                          className="collection-filter-swatch-dot"
                          style={{
                            backgroundColor:
                              swatch?.color || 'var(--color-beige)',
                            backgroundImage: swatchImage
                              ? `url(${swatchImage})`
                              : undefined,
                          }}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="collection-checkbox"
                        >
                          {selected ? '✓' : ''}
                        </span>
                      )}
                      <span>{value.label}</span>
                      <small>{value.count}</small>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function getSelectedChips(
  filters: CollectionFilter[],
  selectedKeys: Set<string>,
) {
  return filters.flatMap((filter) =>
    getFilterValues(filter).flatMap((value) => {
      const input = normalizeCollectionFilterInput(value.input);
      if (!input || !selectedKeys.has(filterKey(input))) return [];
      return [
        {
          input,
          key: `${filter.id}:${value.id}`,
          label: `${filter.label}: ${value.label}`,
        },
      ];
    }),
  );
}

function getFilterValues(filter: CollectionFilter) {
  return filter.type === 'PRICE_RANGE' ? PRICE_FILTER_OPTIONS : filter.values;
}

function ensurePriceFilter(filters: CollectionFilter[]): CollectionFilter[] {
  if (filters.some((filter) => filter.type === 'PRICE_RANGE')) return filters;

  return [
    ...filters,
    {
      id: 'price',
      label: 'Price',
      presentation: null,
      type: 'PRICE_RANGE',
      values: [],
    },
  ];
}

const COLLECTION_PRODUCT_FRAGMENT = `#graphql
  fragment CollectionProduct on Product {
    id
    handle
    title
    tags
    availableForSale
    featuredImage { id altText url width height }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      selectedOptions { name value }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${COLLECTION_PRODUCT_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo { title description }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        filters {
          id
          label
          presentation
          type
          values {
            id
            label
            count
            input
            swatch { color image { previewImage { url } } }
          }
        }
        nodes { ...CollectionProduct }
        pageInfo { hasPreviousPage hasNextPage endCursor startCursor }
      }
    }
  }
` as const;
