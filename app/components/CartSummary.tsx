import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useState} from 'react';
import {Link} from 'react-router';
import {useAside} from './Aside';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const noteInputId = useId();
  const [orderNoteOpen, setOrderNoteOpen] = useState(Boolean(cart.note));
  const [orderNote, setOrderNote] = useState(cart.note ?? '');

  useEffect(() => {
    setOrderNote(cart.note ?? '');
  }, [cart.note]);

  return (
    <div aria-labelledby={summaryId} className={className}>
      <h4 id={summaryId}>Totals</h4>
      <dl role="group" className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {!cart.isOptimistic && cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} withoutTrailingZeros />
          ) : (
            'Updating…'
          )}
        </dd>
      </dl>
      {layout === 'page' ? (
        <>
          <p className="checkout-note">
            Shipping &amp; taxes calculated at checkout.
          </p>
          <div className="cart-order-note">
            <button
              aria-controls={noteInputId}
              aria-expanded={orderNoteOpen}
              className="cart-order-note-toggle"
              onClick={() => setOrderNoteOpen((open) => !open)}
              type="button"
            >
              {orderNoteOpen ? 'Hide order note' : '+ Add order note'}
            </button>
            {orderNoteOpen ? (
              <CartForm action={CartForm.ACTIONS.NoteUpdate} route="/cart">
                {(fetcher) => {
                  const isSubmitting = fetcher.state !== 'idle';
                  return (
                    <>
                      <label htmlFor={noteInputId} className="sr-only">
                        Order note
                      </label>
                      <textarea
                        aria-describedby={`${noteInputId}-status`}
                        id={noteInputId}
                        name="note"
                        onChange={(event) => setOrderNote(event.target.value)}
                        placeholder="Add a note for your order (optional)"
                        rows={3}
                        value={orderNote}
                      />
                      <div className="cart-order-note-actions">
                        <button disabled={isSubmitting} type="submit">
                          {isSubmitting ? 'Saving…' : 'Save note'}
                        </button>
                        <span
                          aria-live="polite"
                          className="cart-order-note-status"
                          id={`${noteInputId}-status`}
                        >
                          {isSubmitting ? 'Saving your note' : ''}
                        </span>
                      </div>
                    </>
                  );
                }}
              </CartForm>
            ) : null}
          </div>
        </>
      ) : (
        <p className="checkout-note">
          Shipping &amp; taxes calculated at checkout.
        </p>
      )}
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} layout={layout} />
    </div>
  );
}

function CartCheckoutActions({
  checkoutUrl,
  layout,
}: {
  checkoutUrl?: string;
  layout: CartLayout;
}) {
  const {close} = useAside();

  if (layout === 'page') {
    return (
      <>
        <div className="cart-checkout-actions">
          {checkoutUrl ? (
            <a className="button button-dark" href={checkoutUrl} target="_self">
              Proceed to Checkout
            </a>
          ) : null}
          <Link className="continue-shopping" to="/collections">
            Continue Shopping
          </Link>
        </div>
        <p className="cart-trust">
          Secure Payment <span>·</span> Easy Returns <span>·</span> Cash on
          Delivery
        </p>
      </>
    );
  }

  return (
    <div className="cart-checkout-actions">
      {checkoutUrl ? (
        <a className="button button-dark" href={checkoutUrl} target="_self">
          Proceed to Checkout
        </a>
      ) : null}
      <Link className="button button-outline" onClick={close} to="/cart">
        View Cart
      </Link>
      <button className="continue-shopping" onClick={close} type="button">
        Continue Shopping
      </button>
      <p className="cart-trust">
        Secure Payment <span>·</span> Easy Returns <span>·</span> Cash on
        Delivery
      </p>
    </div>
  );
}
