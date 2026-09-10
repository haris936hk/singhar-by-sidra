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
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router';
import {getPaginationVariables, Pagination} from '@shopify/hydrogen';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import type {
  CatalogQuery,
  CollectionProductFragment,
} from 'storefrontapi.generated';
import type {Route} from './+types/collections.all';
import {CollectionProductCard} from '~/components/CollectionProductCard';
import {CUSTOMER_WISHLIST_QUERY} from '~/graphql/customer-account/CustomerWishlistQuery';
import {
  COLLECTION_SORT_OPTIONS,
  filterKey,
  getCatalogQuery,
  getCatalogSearchSortVariables,
  getCatalogSortVariables,
  getCollectionSort,
  normalizeCollectionFilterInput,
  parseCollectionFilters,
  PRICE_FILTER_OPTIONS,
  updateCollectionSearchParams,
  type CollectionSortValue,
} from '~/lib/collectionFilters';
import {siteConfig} from '~/lib/site-config';
import {getWishlistProductIds, WISHLIST_PRIVATE_HEADERS} from '~/lib/wishlist';

type AllProductsFilter = CatalogQuery['products']['filters'][number];
type AllProductsFilterValue = AllProductsFilter['values'][number];
type DisplayFilterValue =
  AllProductsFilterValue | (typeof PRICE_FILTER_OPTIONS)[number];
type SelectedFilterChip = {input: ProductFilter; key: string; label: string};
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

export async function loader({context, request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sort = getCollectionSort(url.searchParams.get('sort'));
  const filters = parseCollectionFilters(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 8});
  const {sortKey, reverse} = getCatalogSortVariables(sort);
  const searchPaginationVariables = filters.length
    ? paginationVariables
    : {first: 1};
  const {sortKey: searchSortKey, reverse: searchReverse} =
    getCatalogSearchSortVariables(sort);
  const searchFirst =
    'first' in searchPaginationVariables
      ? searchPaginationVariables.first
      : undefined;
  const searchLast =
    'last' in searchPaginationVariables
      ? searchPaginationVariables.last
      : undefined;
  const searchStartCursor =
    'startCursor' in searchPaginationVariables
      ? searchPaginationVariables.startCursor
      : undefined;
  const searchEndCursor =
    'endCursor' in searchPaginationVariables
      ? searchPaginationVariables.endCursor
      : undefined;
  const [{products, search}, wishlist] = await Promise.all([
    context.storefront.query(CATALOG_QUERY, {
      variables: {
        query: getCatalogQuery(filters),
        filters,
        searchTerm: '*',
        sortKey,
        reverse,
        searchSortKey,
        searchReverse,
        searchFirst,
        searchLast,
        searchStartCursor,
        searchEndCursor,
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

  const loaderData = {
    products,
    filteredProducts: search,
    availableFilters: ensurePriceFilter(
      filters.length ? search.productFilters : products.filters,
    ),
    filters,
    wishlistProductIds: wishlist.productIds,
    sort,
  };

  return wishlist.isLoggedIn
    ? remixData(loaderData, {headers: WISHLIST_PRIVATE_HEADERS})
    : loaderData;
}

export default function AllProducts() {
  const {
    products,
    filteredProducts,
    availableFilters,
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
    () => new Set<string>(activeFilters.map((filter) => filterKey(filter))),
    [activeFilters],
  );
  const selectedChips = useMemo(
    () => getSelectedChips(availableFilters, activeFilterKeys),
    [activeFilterKeys, availableFilters],
  );

  function navigateWithFilters(nextFilters: ProductFilter[]) {
    const search = updateCollectionSearchParams(
      new URLSearchParams(location.search),
      {
        filters: nextFilters,
      },
    );
    if (sheet !== 'filter') setSheet(null);
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
  const catalog = activeFilters.length ? filteredProducts : products;
  const visibleProductCount = catalog.nodes.length;

  return (
    <div className="collection-page all-products-page">
      <div className="collection-breadcrumbs">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">All Products</span>
      </div>

      <section
        aria-labelledby="all-products-heading"
        className="collection-hero all-products-hero"
      >
        <div className="collection-hero-copy">
          <span className="all-products-eyebrow">The complete edit</span>
          <h1 id="all-products-heading">All Products</h1>
          <p>
            Explore handcrafted eastern wear, from everyday pret to
            occasion-ready ensembles.
          </p>
        </div>
      </section>

      <div className="collection-toolbar">
        <span className="collection-result-count">
          {visibleProductCount} {visibleProductCount === 1 ? 'piece' : 'pieces'}
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
          aria-label="All products filters"
          className="collection-filter-sidebar"
        >
          <FilterPanel
            filters={availableFilters}
            onToggle={toggleFilter}
            selectedKeys={activeFilterKeys}
          />
        </aside>

        <section aria-label="All products" className="collection-results">
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

          <Pagination connection={catalog}>
            {({nodes, isLoading, PreviousLink, NextLink}) => (
              <>
                <PreviousLink className="collection-pagination-previous">
                  {isLoading ? 'Loading…' : '↑ Load previous'}
                </PreviousLink>
                {nodes.length ? (
                  <div
                    className={`collection-product-grid density-${gridDensity}`}
                  >
                    {nodes.map((product, index) => {
                      const catalogProduct =
                        product as CollectionProductFragment;
                      return (
                        <CollectionProductCard
                          key={catalogProduct.id}
                          loading={index < 4 ? 'eager' : 'lazy'}
                          initialSaved={wishlistProductIds.includes(
                            catalogProduct.id,
                          )}
                          product={catalogProduct}
                        />
                      );
                    })}
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
                    {isLoading ? 'Loading…' : 'Load more'}
                  </NextLink>
                  {!catalog.pageInfo.hasNextPage ? (
                    <span>You&apos;ve reached the end of the collection.</span>
                  ) : null}
                </div>
              </>
            )}
          </Pagination>
        </section>
      </div>

      {sheet ? (
        <div
          aria-labelledby="all-products-sheet-title"
          aria-modal="true"
          className="collection-sheet-wrap"
          role="dialog"
        >
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
                <h2 id="all-products-sheet-title">Sort By</h2>
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
                  <h2 id="all-products-sheet-title">Filters</h2>
                  <button onClick={clearFilters} type="button">
                    Clear All
                  </button>
                </div>
                <div className="collection-sheet-scroll">
                  <FilterPanel
                    filters={availableFilters}
                    onToggle={toggleFilter}
                    selectedKeys={activeFilterKeys}
                  />
                </div>
                <button
                  className="button button-dark collection-sheet-apply"
                  onClick={() => setSheet(null)}
                  type="button"
                >
                  Show {visibleProductCount} Results
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
        aria-controls="all-products-sort-menu"
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
          id="all-products-sort-menu"
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
  filters: AllProductsFilter[];
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
        const values = getFilterValues(filter, selectedKeys);
        if (!values.length) return null;
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
                      {value.count !== null ? (
                        <small>{value.count}</small>
                      ) : null}
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
  filters: AllProductsFilter[],
  selectedKeys: Set<string>,
): SelectedFilterChip[] {
  return filters.flatMap((filter) =>
    getFilterValues(filter, selectedKeys).flatMap((value) => {
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

function getFilterValues(
  filter: AllProductsFilter,
  selectedKeys: Set<string>,
): DisplayFilterValue[] {
  if (filter.type === 'PRICE_RANGE') {
    return PRICE_FILTER_OPTIONS.map((value) => ({...value}));
  }

  const values = filter.values.filter((value) => {
    const input = normalizeCollectionFilterInput(value.input);
    return (
      value.count > 0 || (input ? selectedKeys.has(filterKey(input)) : false)
    );
  });
  if (!values.length && filter.label.toLowerCase() === 'price') {
    return PRICE_FILTER_OPTIONS.map((value) => ({...value}));
  }
  return values;
}

function ensurePriceFilter(filters: AllProductsFilter[]): AllProductsFilter[] {
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

const CATALOG_QUERY = `#graphql
  fragment AllProductsCatalogItem on Product {
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
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
    $searchTerm: String!
    $filters: [ProductFilter!]
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $searchFirst: Int
    $searchLast: Int
    $searchStartCursor: String
    $searchEndCursor: String
    $searchSortKey: SearchSortKeys
    $searchReverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $query
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
      nodes { ...AllProductsCatalogItem }
      pageInfo { hasPreviousPage hasNextPage endCursor startCursor }
    }
    search(
      first: $searchFirst
      last: $searchLast
      before: $searchStartCursor
      after: $searchEndCursor
      query: $searchTerm
      productFilters: $filters
      sortKey: $searchSortKey
      reverse: $searchReverse
      types: [PRODUCT]
      unavailableProducts: SHOW
    ) {
      nodes { ... on Product { ...AllProductsCatalogItem } }
      pageInfo { hasPreviousPage hasNextPage endCursor startCursor }
      productFilters {
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
    }
  }
` as const;
