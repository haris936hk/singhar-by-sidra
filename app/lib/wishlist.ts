import type {CustomerWishlistQuery} from 'customer-accountapi.generated';
import {CUSTOMER_WISHLIST_QUERY} from '~/graphql/customer-account/CustomerWishlistQuery';

export const WISHLIST_NAMESPACE = 'custom' as const;
export const WISHLIST_KEY = 'wishlist' as const;
export const WISHLIST_TYPE = 'list.product_reference' as const;
export const MAX_WISHLIST_ITEMS = 128;
export const WISHLIST_PRIVATE_HEADERS = {'Cache-Control': 'private, no-store'};

export type WishlistActionIntent = 'add' | 'remove';

export type WishlistActionResponse = {
  error: string | null;
  intent?: WishlistActionIntent;
  productId?: string;
  saved?: boolean;
};

type WishlistReadResponse = {
  data?: CustomerWishlistQuery | null;
  errors?: readonly unknown[];
};

export async function getWishlistProductIds({
  isLoggedIn,
  read,
}: {
  isLoggedIn: () => Promise<boolean>;
  read: () => Promise<WishlistReadResponse>;
}) {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return {isLoggedIn: false, productIds: []};

    const response = await read();
    const metafield = response.data?.customer?.metafield;
    if (
      response.errors?.length ||
      !response.data?.customer ||
      (metafield && metafield.type !== WISHLIST_TYPE)
    ) {
      return {isLoggedIn: true, productIds: []};
    }

    return {
      isLoggedIn: true,
      productIds: parseWishlistProductIds(metafield?.jsonValue),
    };
  } catch {
    return {isLoggedIn: true, productIds: []};
  }
}

export function isProductGid(value: unknown): value is string {
  return (
    typeof value === 'string' && /^gid:\/\/shopify\/Product\/\d+$/.test(value)
  );
}

export function parseWishlistProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(value.filter(isProductGid))).slice(
    0,
    MAX_WISHLIST_ITEMS,
  );
}

export function getWishlistActionInput(form: FormData) {
  const submittedIntent = form.get('intent');
  const productId = form.get('productId');
  const intent: WishlistActionIntent | null =
    submittedIntent === 'add' || submittedIntent === 'remove'
      ? submittedIntent
      : null;

  if (!intent || !isProductGid(productId)) {
    return null;
  }

  return {intent, productId};
}

export function updateWishlistProductIds(
  currentIds: string[],
  productId: string,
  intent: WishlistActionIntent,
) {
  const ids = parseWishlistProductIds(currentIds);

  if (intent === 'add') {
    if (ids.length >= MAX_WISHLIST_ITEMS) return ids;
    return ids.includes(productId) ? ids : [...ids, productId];
  }

  return ids.filter((id) => id !== productId);
}

export function getWishlistErrorMessage() {
  return 'We could not update your wishlist. Please refresh the page and try again.';
}
