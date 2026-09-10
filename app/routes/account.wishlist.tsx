import {Image, Money} from '@shopify/hydrogen';
import type {CustomerWishlistQuery} from 'customer-accountapi.generated';
import type {WishlistProductsQuery} from 'storefrontapi.generated';
import {
  data as remixData,
  Link,
  useFetcher,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/account.wishlist';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {
  CUSTOMER_WISHLIST_QUERY,
  CUSTOMER_WISHLIST_UPDATE_MUTATION,
} from '~/graphql/customer-account/CustomerWishlistQuery';
import {
  getWishlistActionInput,
  getWishlistErrorMessage,
  isProductGid,
  parseWishlistProductIds,
  updateWishlistProductIds,
  WISHLIST_KEY,
  WISHLIST_NAMESPACE,
  WISHLIST_TYPE,
  type WishlistActionResponse,
} from '~/lib/wishlist';
import {useVariantUrl} from '~/lib/variants';

const PRIVATE_HEADERS = {'Cache-Control': 'no-store'};
const WISHLIST_QUERY_ERROR =
  'We could not load your wishlist. Please refresh the page and try again.';

type WishlistProduct = Extract<
  NonNullable<WishlistProductsQuery['nodes'][number]>,
  {__typename?: 'Product'}
>;

type WishlistItem = {
  id: string;
  product: WishlistProduct | null;
};

type WishlistLoaderData = {
  count: number;
  error: string | null;
  items: WishlistItem[];
};

type CustomerWishlistSnapshot = {
  customer: CustomerWishlistQuery['customer'] | null;
  error: string | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Wishlist'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  try {
    const snapshot = await readCustomerWishlist(context);
    if (snapshot.error || !snapshot.customer) {
      return remixData<WishlistLoaderData>(
        {count: 0, error: snapshot.error ?? WISHLIST_QUERY_ERROR, items: []},
        {headers: PRIVATE_HEADERS},
      );
    }

    const ids = parseWishlistProductIds(snapshot.customer.metafield?.jsonValue);
    if (!ids.length) {
      return remixData<WishlistLoaderData>(
        {count: 0, error: null, items: []},
        {headers: PRIVATE_HEADERS},
      );
    }

    const {products, error} = await loadWishlistProducts(context, ids);
    if (error) {
      return remixData<WishlistLoaderData>(
        {count: 0, error, items: []},
        {headers: PRIVATE_HEADERS},
      );
    }

    const items = ids.map((id) => ({
      id,
      product: products.get(id) ?? null,
    }));

    return remixData<WishlistLoaderData>(
      {
        count: items.filter((item) => item.product).length,
        error: null,
        items,
      },
      {headers: PRIVATE_HEADERS},
    );
  } catch {
    return remixData<WishlistLoaderData>(
      {count: 0, error: WISHLIST_QUERY_ERROR, items: []},
      {headers: PRIVATE_HEADERS},
    );
  }
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method.toUpperCase() !== 'POST') {
    return remixData<WishlistActionResponse>(
      {error: 'Method not allowed'},
      {status: 405, headers: PRIVATE_HEADERS},
    );
  }

  await context.customerAccount.handleAuthStatus();
  const input = getWishlistActionInput(await request.formData());

  if (!input) {
    return remixData<WishlistActionResponse>(
      {error: 'We could not identify that product. Please try again.'},
      {status: 400, headers: PRIVATE_HEADERS},
    );
  }

  try {
    const snapshot = await readCustomerWishlist(context);
    if (snapshot.error || !snapshot.customer) {
      return wishlistErrorResponse(input.productId, input.intent);
    }

    const currentIds = parseWishlistProductIds(
      snapshot.customer.metafield?.jsonValue,
    );
    const nextIds = updateWishlistProductIds(
      currentIds,
      input.productId,
      input.intent,
    );

    if (nextIds.join('|') === currentIds.join('|')) {
      const isAlreadySaved = currentIds.includes(input.productId);
      if (input.intent === 'add' && !isAlreadySaved) {
        return wishlistErrorResponse(input.productId, input.intent);
      }

      return remixData<WishlistActionResponse>(
        {
          error: null,
          intent: input.intent,
          productId: input.productId,
          saved: isAlreadySaved,
        },
        {headers: PRIVATE_HEADERS},
      );
    }

    const response = await context.customerAccount.mutate(
      CUSTOMER_WISHLIST_UPDATE_MUTATION,
      {
        variables: {
          language: context.customerAccount.i18n.language,
          metafields: [
            {
              compareDigest: snapshot.customer.metafield?.compareDigest ?? null,
              key: WISHLIST_KEY,
              namespace: WISHLIST_NAMESPACE,
              ownerId: snapshot.customer.id,
              type: WISHLIST_TYPE,
              value: JSON.stringify(nextIds),
            },
          ],
        },
      },
    );

    if (
      response.errors?.length ||
      response.data?.metafieldsSet?.userErrors?.length ||
      !response.data?.metafieldsSet?.metafields?.length
    ) {
      return wishlistErrorResponse(input.productId, input.intent);
    }

    return remixData<WishlistActionResponse>(
      {
        error: null,
        intent: input.intent,
        productId: input.productId,
        saved: nextIds.includes(input.productId),
      },
      {headers: PRIVATE_HEADERS},
    );
  } catch {
    return wishlistErrorResponse(input.productId, input.intent);
  }
}

export default function Wishlist() {
  const {count, error, items} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';
  const products = items.flatMap((item) =>
    item.product ? [{id: item.id, product: item.product}] : [],
  );
  const unavailableItems = items.filter((item) => !item.product);

  return (
    <section
      aria-busy={isLoading}
      aria-labelledby="wishlist-heading"
      className="account-wishlist"
    >
      <header className="account-wishlist-header">
        <div>
          <p className="account-eyebrow">Your saved pieces</p>
          <h1 id="wishlist-heading">Wishlist</h1>
        </div>
        {count ? (
          <p className="account-wishlist-count">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="account-wishlist-error" role="alert" tabIndex={-1}>
          {error}
        </p>
      ) : null}

      {!error && count === 0 && items.length === 0 ? <EmptyWishlist /> : null}

      {products.length ? (
        <ul className="account-wishlist-grid">
          {products.map(({id, product}) => (
            <WishlistProductCard key={id} product={product} />
          ))}
        </ul>
      ) : null}

      {unavailableItems.length ? (
        <section
          aria-labelledby="wishlist-unavailable-heading"
          className="account-wishlist-unavailable"
        >
          <h2 id="wishlist-unavailable-heading">Unavailable pieces</h2>
          <ul>
            {unavailableItems.map((item) => (
              <UnavailableWishlistItem id={item.id} key={item.id} />
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function EmptyWishlist() {
  return (
    <div className="account-wishlist-empty">
      <h2>No saved pieces yet</h2>
      <p>Save pieces you love and find them here whenever you are ready.</p>
      <Link className="button button-dark" to="/collections/all">
        Browse the collection
      </Link>
    </div>
  );
}

function WishlistProductCard({product}: {product: WishlistProduct}) {
  const {open} = useAside();
  const remove = useFetcher<WishlistActionResponse>();
  const productUrl = useVariantUrl(product.handle);
  const variant = getSingleVariant(product);
  const isRemoving = remove.state !== 'idle';
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAtPrice = variant?.compareAtPrice ?? null;
  const isSale = Boolean(
    compareAtPrice && Number(compareAtPrice.amount) > Number(price.amount),
  );

  return (
    <li>
      <article className="account-wishlist-card">
        <div className="account-wishlist-card-media-wrap">
          <Link
            aria-label={`View ${product.title}`}
            className="account-wishlist-card-media"
            prefetch="intent"
            to={productUrl}
          >
            {product.featuredImage ? (
              <Image
                alt={product.featuredImage.altText || product.title}
                aspectRatio="3/4"
                data={product.featuredImage}
                loading="lazy"
                sizes="(min-width: 1200px) 22vw, (min-width: 768px) 29vw, 46vw"
              />
            ) : (
              <span className="account-wishlist-image-unavailable">
                Image unavailable
              </span>
            )}
            {getBadge(product.tags) ? (
              <span className="account-wishlist-badge">
                {getBadge(product.tags)}
              </span>
            ) : null}
          </Link>
          <remove.Form
            action="/account/wishlist"
            className="account-wishlist-remove-form"
            method="post"
          >
            <input name="intent" type="hidden" value="remove" />
            <input name="productId" type="hidden" value={product.id} />
            <button
              aria-busy={isRemoving}
              aria-label={`Remove ${product.title} from wishlist`}
              disabled={isRemoving}
              type="submit"
            >
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remove</span>
            </button>
          </remove.Form>
          {!product.availableForSale ? (
            <div className="account-wishlist-sold-out" role="status">
              <span>Sold out</span>
            </div>
          ) : null}
        </div>

        <div className="account-wishlist-card-details">
          <Link className="account-wishlist-card-title" to={productUrl}>
            {product.title}
          </Link>
          <div className="account-wishlist-card-price">
            {isSale ? (
              <>
                <Money
                  className="collection-price-compare"
                  data={compareAtPrice!}
                  withoutTrailingZeros
                />
                <Money
                  className="collection-price-sale"
                  data={price}
                  withoutTrailingZeros
                />
              </>
            ) : (
              <Money data={price} withoutTrailingZeros />
            )}
          </div>
          {remove.data?.error ? (
            <p className="account-wishlist-card-error" role="alert">
              {remove.data.error}
            </p>
          ) : null}
          <WishlistPurchaseAction
            onAdd={() => open('cart')}
            product={product}
            productUrl={productUrl}
            variant={variant}
          />
        </div>
      </article>
    </li>
  );
}

function UnavailableWishlistItem({id}: {id: string}) {
  const remove = useFetcher<WishlistActionResponse>();
  const isRemoving = remove.state !== 'idle';

  return (
    <li className="account-wishlist-unavailable-item">
      <span>This saved piece is no longer available.</span>
      <remove.Form action="/account/wishlist" method="post">
        <input name="intent" type="hidden" value="remove" />
        <input name="productId" type="hidden" value={id} />
        <button aria-busy={isRemoving} disabled={isRemoving} type="submit">
          {isRemoving ? 'Removing' : 'Remove'}
        </button>
      </remove.Form>
      {remove.data?.error ? (
        <p className="account-wishlist-card-error" role="alert">
          {remove.data.error}
        </p>
      ) : null}
    </li>
  );
}

function WishlistPurchaseAction({
  onAdd,
  product,
  productUrl,
  variant,
}: {
  onAdd: () => void;
  product: WishlistProduct;
  productUrl: string;
  variant: WishlistProduct['variants']['nodes'][number] | null;
}) {
  if (!product.availableForSale) {
    return (
      <button className="account-wishlist-purchase" disabled type="button">
        Sold out
      </button>
    );
  }

  if (hasMultipleVariants(product)) {
    return (
      <Link
        className="account-wishlist-purchase"
        to={productUrl}
      >
        View options
      </Link>
    );
  }

  if (!variant?.availableForSale) {
    return (
      <button className="account-wishlist-purchase" disabled type="button">
        Sold out
      </button>
    );
  }

  return (
    <AddToCartButton
      className="account-wishlist-purchase account-wishlist-add"
      lines={[{merchandiseId: variant.id, quantity: 1}]}
      onClick={onAdd}
    >
      Add to cart
    </AddToCartButton>
  );
}

function getSingleVariant(product: WishlistProduct) {
  if (hasMultipleVariants(product)) {
    return null;
  }

  return product.variants.nodes[0] ?? null;
}

function hasMultipleVariants(product: WishlistProduct) {
  return (
    product.variants.pageInfo.hasNextPage || product.variants.nodes.length > 1
  );
}

function getBadge(tags: string[]) {
  const tag = tags.find((value) =>
    /^(new|best seller|bestseller|sale)$/i.test(value.trim()),
  );
  if (!tag) return null;
  return tag.toLowerCase() === 'bestseller' ? 'Best Seller' : tag;
}

async function readCustomerWishlist(
  context: Route.LoaderArgs['context'],
): Promise<CustomerWishlistSnapshot> {
  const response = await context.customerAccount.query(CUSTOMER_WISHLIST_QUERY, {
    variables: {language: context.customerAccount.i18n.language},
  });

  if (response.errors?.length || !response.data?.customer) {
    return {customer: null, error: WISHLIST_QUERY_ERROR};
  }

  const metafield = response.data.customer.metafield;
  if (metafield && metafield.type !== WISHLIST_TYPE) {
    return {customer: null, error: WISHLIST_QUERY_ERROR};
  }

  return {customer: response.data.customer, error: null};
}

async function loadWishlistProducts(
  context: Route.LoaderArgs['context'],
  ids: string[],
) {
  const response = await context.storefront.query(WISHLIST_PRODUCTS_QUERY, {
    cache: context.storefront.CacheNone(),
    displayName: 'Wishlist products',
    variables: {
      country: context.storefront.i18n.country,
      ids,
      language: context.storefront.i18n.language,
    },
  });

  if (response.errors?.length) {
    return {error: WISHLIST_QUERY_ERROR, products: new Map<string, WishlistProduct>()};
  }

  const products = new Map<string, WishlistProduct>();
  for (const node of response.nodes) {
    if (node?.__typename === 'Product' && isProductGid(node.id)) {
      products.set(node.id, node);
    }
  }

  return {error: null, products};
}

function wishlistErrorResponse(
  productId: string,
  intent: 'add' | 'remove',
) {
  return remixData<WishlistActionResponse>(
    {
      error: getWishlistErrorMessage(),
      intent,
      productId,
    },
    {status: 400, headers: PRIVATE_HEADERS},
  );
}

const WISHLIST_PRODUCTS_QUERY = `#graphql
  query WishlistProducts(
    $country: CountryCode
    $ids: [ID!]!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        __typename
        id
        handle
        title
        tags
        availableForSale
        featuredImage { id altText url width height }
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        variants(first: 2) {
          nodes {
            id
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
          pageInfo { hasNextPage }
        }
      }
    }
  }
` as const;
