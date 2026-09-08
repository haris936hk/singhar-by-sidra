import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {
  getCartWithConfirmedSnapshot,
  useAside,
  type CartAddFeedback,
} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  children?: React.ReactNode;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
export type CartLineFeedback = {
  id: number;
  type: 'new' | 'updated';
};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({
  children,
  layout,
  cart: originalCart,
}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const {cartAddFeedback, confirmedCart} = useAside();
  const displayedCart =
    layout === 'aside'
      ? getCartWithConfirmedSnapshot(originalCart, confirmedCart)
      : originalCart;
  const cart = useOptimisticCart(displayedCart);

  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const className = `cart-main cart-main-${layout} ${withDiscount ? 'with-discount' : ''}`;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);
  const lineFeedback =
    layout === 'aside'
      ? getCartLineFeedback(cart?.lines?.nodes ?? [], cartAddFeedback)
      : new Map<string, CartLineFeedback>();

  return (
    <section
      className={className}
      aria-label={layout === 'page' ? 'Cart page' : 'Cart drawer'}
    >
      {layout === 'page' && cartHasItems ? (
        <div className="cart-page-heading">
          <h1>Your Bag</h1>
          <span aria-live="polite">{cart?.totalQuantity ?? 0} items</span>
        </div>
      ) : null}
      <CartEmpty hidden={cartHasItems} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Line items
        </p>
        <div>
          <ul aria-labelledby="cart-lines">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                  feedback={lineFeedback.get(line.id)}
                />
              );
            })}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
        {layout === 'page' ? children : null}
      </div>
    </section>
  );
}

function getCartLineFeedback(
  currentLines: CartLine[],
  feedback: CartAddFeedback | null,
) {
  const lineFeedback = new Map<string, CartLineFeedback>();
  if (!feedback) return lineFeedback;

  for (const input of feedback.lines) {
    const resultLine = feedback.cart.lines.nodes.find(
      (line) => line.merchandise.id === input.merchandiseId,
    );
    const currentLine = currentLines.find(
      (line) => line.merchandise.id === input.merchandiseId,
    );
    if (!resultLine || !currentLine) continue;

    lineFeedback.set(currentLine.id, {
      id: feedback.id,
      type: resultLine.quantity === input.quantity ? 'new' : 'updated',
    });
  }

  return lineFeedback;
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div className="cart-empty empty-state" hidden={hidden}>
      <h3>Your bag is empty</h3>
      <p>Discover pieces you&rsquo;ll love and they&rsquo;ll appear here.</p>
      <Link
        className="button button-dark"
        to="/collections"
        onClick={close}
        prefetch="viewport"
      >
        Continue shopping
      </Link>
    </div>
  );
}
