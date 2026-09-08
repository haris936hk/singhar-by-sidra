import {useEffect, useRef} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {
  CartForm,
  type CartQueryDataReturn,
  type OptimisticCartLineInput,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

type CartAddActionData = CartQueryDataReturn<
  CartApiQueryFragment | null
>;

export function AddToCartButton({
  analytics,
  children,
  className,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<CartAddActionData>) => (
        <AddToCartFormContents
          analytics={analytics}
          className={className}
          disabled={disabled}
          fetcher={fetcher}
          lines={lines}
          onClick={onClick}
        >
          {children}
        </AddToCartFormContents>
      )}
    </CartForm>
  );
}

function AddToCartFormContents({
  analytics,
  children,
  className,
  disabled,
  fetcher,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  fetcher: FetcherWithComponents<CartAddActionData>;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  const {notifyCartAdd} = useAside();
  const lastNotifiedData = useRef<CartAddActionData | undefined>(undefined);

  useEffect(() => {
    const result = fetcher.data;
    if (!result || result === lastNotifiedData.current) return;
    lastNotifiedData.current = result;
    if (!result.cart || result.errors?.length || result.userErrors?.length)
      return;

    notifyCartAdd({
      cart: result.cart,
      lines: lines.map((line) => ({
        merchandiseId: line.merchandiseId,
        quantity: line.quantity ?? 1,
      })),
    });
  }, [fetcher.data, lines, notifyCartAdd]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        aria-busy={fetcher.state !== 'idle'}
        className={className}
        type="submit"
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
      >
        {children}
      </button>
    </>
  );
}
