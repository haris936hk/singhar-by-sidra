import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

export const COLLECTION_SORT_OPTIONS = [
  {value: 'newest', label: 'Newest'},
  {value: 'price-low', label: 'Price: Low to High'},
  {value: 'price-high', label: 'Price: High to Low'},
  {value: 'best-selling', label: 'Best Selling'},
] as const;

export type CollectionSortValue = (typeof COLLECTION_SORT_OPTIONS)[number]['value'];

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

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 4 || value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return true;
  }
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
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
      ([key, item]) => FILTER_KEYS.has(key) && item !== undefined && isJsonValue(item),
    )
  );
}

export function normalizeCollectionFilterInput(value: unknown): ProductFilter | null {
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

export function parseCollectionFilters(params: URLSearchParams): ProductFilter[] {
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
