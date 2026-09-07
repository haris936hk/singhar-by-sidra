import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

export const COLLECTION_SORT_OPTIONS = [
  {value: 'newest', label: 'Newest'},
  {value: 'price-low', label: 'Price: Low to High'},
  {value: 'price-high', label: 'Price: High to Low'},
  {value: 'best-selling', label: 'Best Selling'},
] as const;

export type CollectionSortValue =
  (typeof COLLECTION_SORT_OPTIONS)[number]['value'];

// The design's price bands are expressed in the active Shopify market currency.
// The storefront currently resolves to Pakistan, so these labels are displayed as PKR.
// Use cent-safe boundaries to keep the bands mutually exclusive.
export const PRICE_FILTER_OPTIONS = [
  {
    id: 'price-under-10000',
    label: 'Under Rs. 10,000',
    count: null,
    input: JSON.stringify({price: {max: 9999.99}}),
  },
  {
    id: 'price-10000-25000',
    label: 'Rs. 10,000 – 25,000',
    count: null,
    input: JSON.stringify({price: {min: 10000, max: 25000}}),
  },
  {
    id: 'price-over-25000',
    label: 'Above Rs. 25,000',
    count: null,
    input: JSON.stringify({price: {min: 25000.01}}),
  },
] as const;

const SORT_VALUES = new Set<CollectionSortValue>(
  COLLECTION_SORT_OPTIONS.map((option) => option.value),
);

const FILTER_KEYS = new Set([
  'available',
  'category',
  'price',
  'productMetafield',
  'productType',
  'productVendor',
  'tag',
  'taxonomyMetafield',
  'variantMetafield',
  'variantOption',
]);

export function getCollectionSort(value: string | null): CollectionSortValue {
  return value && SORT_VALUES.has(value as CollectionSortValue)
    ? (value as CollectionSortValue)
    : 'newest';
}

export function getCollectionSortVariables(sort: CollectionSortValue) {
  switch (sort) {
    case 'price-low':
      return {sortKey: 'PRICE' as const, reverse: false};
    case 'price-high':
      return {sortKey: 'PRICE' as const, reverse: true};
    case 'best-selling':
      return {sortKey: 'BEST_SELLING' as const, reverse: false};
    default:
      return {sortKey: 'CREATED' as const, reverse: true};
  }
}

export function getCatalogSortVariables(sort: CollectionSortValue) {
  switch (sort) {
    case 'price-low':
      return {sortKey: 'PRICE' as const, reverse: false};
    case 'price-high':
      return {sortKey: 'PRICE' as const, reverse: true};
    case 'best-selling':
      return {sortKey: 'BEST_SELLING' as const, reverse: false};
    default:
      return {sortKey: 'CREATED_AT' as const, reverse: true};
  }
}

export function getCatalogSearchSortVariables(sort: CollectionSortValue) {
  switch (sort) {
    case 'price-low':
      return {sortKey: 'PRICE' as const, reverse: false};
    case 'price-high':
      return {sortKey: 'PRICE' as const, reverse: true};
    default:
      return {sortKey: 'RELEVANCE' as const, reverse: false};
  }
}

function quoteSearchValue(value: string) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function getCatalogFilterQuery(filter: ProductFilter) {
  const clauses: string[] = [];
  if (filter.available !== undefined && filter.available !== null) {
    clauses.push(`available_for_sale:${filter.available}`);
  }
  if (filter.productType) {
    clauses.push(`product_type:${quoteSearchValue(filter.productType)}`);
  }
  if (filter.productVendor) {
    clauses.push(`vendor:${quoteSearchValue(filter.productVendor)}`);
  }
  if (filter.tag) {
    clauses.push(`tag:${quoteSearchValue(filter.tag)}`);
  }
  if (filter.price) {
    if (filter.price.min !== undefined && filter.price.min !== null) {
      clauses.push(`variants.price:>=${filter.price.min}`);
    }
    if (filter.price.max !== undefined && filter.price.max !== null) {
      clauses.push(`variants.price:<=${filter.price.max}`);
    }
  }
  if (filter.variantOption) {
    clauses.push(
      `option:${quoteSearchValue(filter.variantOption.name)}:${quoteSearchValue(filter.variantOption.value)}`,
    );
  }
  return clauses;
}

export function getCatalogQuery(filters: ProductFilter[]) {
  return filters.flatMap(getCatalogFilterQuery).join(' AND ');
}

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 4 || value === null) return true;
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return true;
  }
  if (Array.isArray(value))
    return value.every((item) => isJsonValue(item, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.entries(value).every(
    ([key, item]) => key.length < 80 && isJsonValue(item, depth + 1),
  );
}

function isProductFilter(value: unknown): value is ProductFilter {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, item]) =>
        FILTER_KEYS.has(key) && item !== undefined && isJsonValue(item),
    )
  );
}

export function normalizeCollectionFilterInput(
  value: unknown,
): ProductFilter | null {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return isProductFilter(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isProductFilter(value) ? value : null;
}

export function parseCollectionFilters(
  params: URLSearchParams,
): ProductFilter[] {
  return params.getAll('filter').flatMap((value) => {
    try {
      const parsed: unknown = JSON.parse(value);
      const filter = normalizeCollectionFilterInput(parsed);
      return filter ? [filter] : [];
    } catch {
      return [];
    }
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function filterKey(value: unknown): string {
  return stableStringify(value);
}

export function updateCollectionSearchParams(
  current: URLSearchParams,
  updates: {filters?: ProductFilter[]; sort?: CollectionSortValue},
) {
  const next = new URLSearchParams(current);
  next.delete('cursor');
  next.delete('direction');

  if (updates.sort) {
    if (updates.sort === 'newest') next.delete('sort');
    else next.set('sort', updates.sort);
  }

  if (updates.filters) {
    next.delete('filter');
    updates.filters.forEach((filter) => {
      next.append('filter', JSON.stringify(filter));
    });
  }

  return next;
}
