import {Suspense} from 'react';
import {
  Await,
  data,
  Link,
  useLoaderData,
  type HeadersFunction,
} from 'react-router';
import type {Route} from './+types/cart';
import {
  Analytics,
  CartForm,
  Image,
  Money,
  type CartQueryDataReturn,
} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Your Bag | Singhar by Sidra'}];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    case CartForm.ACTIONS.NoteUpdate:
      result = await cart.updateNote(inputs.note);
      break;
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart, storefront} = context;
  const cartData = await cart.get();
  const firstProductId = cartData?.lines.nodes.find((line) => {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      return false;
    }
    return Boolean(line.merchandise.product?.id);
  })?.merchandise.product.id;

  return {
    cart: cartData,
    recommendations: firstProductId
      ? loadDeferredData({storefront, productId: firstProductId})
      : Promise.resolve({recommendations: []}),
  };
}

export default function Cart() {
  const {cart, recommendations} = useLoaderData<typeof loader>();

  return (
    <div className="cart cart-page">
      <CartMain layout="page" cart={cart}>
        <Recommendations recommendations={recommendations} />
      </CartMain>
      <Analytics.CartView />
    </div>
  );
}

function loadDeferredData({
  storefront,
  productId,
}: {
  storefront: Route.LoaderArgs['context']['storefront'];
  productId: string;
}) {
  return storefront
    .query(CART_RECOMMENDATIONS_QUERY, {
      variables: {productId},
      cache: storefront.CacheLong(),
      displayName: 'Cart recommendations',
    })
    .then(({productRecommendations, errors}) => {
      if (errors?.length) {
        console.error('Cart recommendations query failed', errors);
      }
      return {recommendations: productRecommendations ?? []};
    })
    .catch((error: unknown) => {
      console.error('Cart recommendations request failed', error);
      return {recommendations: []};
    });
}

function Recommendations({
  recommendations,
}: {
  recommendations: ReturnType<typeof loadDeferredData>;
}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={recommendations}>
        {(data) =>
          data.recommendations.length ? (
            <section
              aria-labelledby="cart-recommendations-title"
              className="cart-recommendations"
            >
              <h2 id="cart-recommendations-title">You May Also Like</h2>
              <div className="cart-recommendation-grid">
                {data.recommendations.slice(0, 4).map((recommendation) => {
                  const variant =
                    recommendation.selectedOrFirstAvailableVariant;
                  const image = variant?.image ?? recommendation.featuredImage;

                  return (
                    <Link
                      className="cart-recommendation-card"
                      key={recommendation.id}
                      to={`/products/${recommendation.handle}`}
                    >
                      <div className="cart-recommendation-image">
                        {image ? (
                          <Image
                            alt={image.altText || recommendation.title}
                            data={image}
                            loading="lazy"
                            sizes="(min-width: 768px) 25vw, 50vw"
                          />
                        ) : null}
                      </div>
                      <h3>{recommendation.title}</h3>
                      {variant?.price ? (
                        <Money data={variant.price} withoutTrailingZeros />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null
        }
      </Await>
    </Suspense>
  );
}

const CART_RECOMMENDATIONS_QUERY = `#graphql
  query CartRecommendations($country: CountryCode, $language: LanguageCode, $productId: ID!) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: RELATED) {
      id
      title
      handle
      featuredImage { id url altText width height }
      selectedOrFirstAvailableVariant {
        availableForSale
        image { id url altText width height }
        price { amount currencyCode }
      }
    }
  }
` as const;
