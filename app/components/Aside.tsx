import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type {OptimisticCartLineInput} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type AsideType = 'search' | 'cart' | 'mobile' | 'account' | 'closed';
export type CartAddFeedbackLine = {
  merchandiseId: OptimisticCartLineInput['merchandiseId'];
  quantity: number;
};
export type CartAddFeedback = {
  id: number;
  lines: CartAddFeedbackLine[];
  cart: CartApiQueryFragment;
};
export type ConfirmedCartSnapshot = {
  id: number;
  cart: CartApiQueryFragment;
};

export function getCartWithConfirmedSnapshot(
  cart: CartApiQueryFragment | null,
  snapshot: ConfirmedCartSnapshot | null,
) {
  if (!snapshot) return cart;
  if (!cart) return snapshot.cart;

  const snapshotUpdatedAt = Date.parse(snapshot.cart.updatedAt);
  const cartUpdatedAt = Date.parse(cart.updatedAt);
  if (snapshotUpdatedAt !== cartUpdatedAt) {
    return snapshotUpdatedAt > cartUpdatedAt ? snapshot.cart : cart;
  }

  return cart.id === snapshot.cart.id ? cart : snapshot.cart;
}
type AsideContextValue = {
  type: AsideType;
  open: (mode: Exclude<AsideType, 'closed'>) => void;
  close: () => void;
  cartAddFeedback: CartAddFeedback | null;
  confirmedCart: ConfirmedCartSnapshot | null;
  notifyCartAdd: (feedback: Omit<CartAddFeedback, 'id'>) => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Aside({
  children,
  heading,
  headingMeta,
  type,
}: {
  children?: React.ReactNode;
  type: Exclude<AsideType, 'closed'>;
  heading: React.ReactNode;
  headingMeta?: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const headingId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const dialogLabel =
    type === 'search'
      ? {'aria-label': 'Search'}
      : {'aria-labelledby': headingId};

  useEffect(() => {
    if (!expanded) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${scrollbarWidth}px`;

    requestAnimationFrame(() => {
      const autofocusTarget =
        panel?.querySelector<HTMLElement>('[data-autofocus]');
      const fallbackTarget =
        panel?.querySelector<HTMLElement>('input, button, a');
      (autofocusTarget ?? fallbackTarget)?.focus();
    });

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      previouslyFocused?.focus();
    };
  }, [close, expanded]);

  return (
    <div
      aria-hidden={!expanded}
      className={`overlay overlay-${type} ${expanded ? 'expanded' : ''}`}
    >
      <button
        aria-label={`Close ${String(heading).toLowerCase()}`}
        className="close-outside"
        onClick={close}
        tabIndex={expanded ? 0 : -1}
      />
      <aside
        {...dialogLabel}
        aria-modal="true"
        className="aside-panel"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        {type !== 'search' ? (
          <header className="aside-header">
            <div className="aside-heading">
              <h2 id={headingId}>{heading}</h2>
              {headingMeta}
            </div>
            <button
              aria-label="Close"
              className="icon-button aside-close"
              data-autofocus={type === 'mobile' ? true : undefined}
              onClick={close}
            >
              <span aria-hidden>×</span>
            </button>
          </header>
        ) : null}
        <div className="aside-content">{children}</div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [cartAddFeedback, setCartAddFeedback] =
    useState<CartAddFeedback | null>(null);
  const [confirmedCart, setConfirmedCart] =
    useState<ConfirmedCartSnapshot | null>(null);
  const cartAddFeedbackId = useRef(0);
  const close = useCallback(() => setType('closed'), []);
  const open = useCallback(
    (mode: Exclude<AsideType, 'closed'>) => setType(mode),
    [],
  );
  const notifyCartAdd = useCallback(
    (feedback: Omit<CartAddFeedback, 'id'>) => {
      const id = ++cartAddFeedbackId.current;
      const nextFeedback = {id, ...feedback};
      setCartAddFeedback(nextFeedback);
      setConfirmedCart((current) => {
        if (!current || isNewerCartSnapshot(nextFeedback, current)) {
          return {id, cart: feedback.cart};
        }
        return current;
      });
    },
    [],
  );
  return (
    <AsideContext.Provider
      value={{
        type,
        open,
        close,
        cartAddFeedback,
        confirmedCart,
        notifyCartAdd,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

function isNewerCartSnapshot(
  next: CartAddFeedback,
  current: ConfirmedCartSnapshot,
) {
  const nextUpdatedAt = Date.parse(next.cart.updatedAt);
  const currentUpdatedAt = Date.parse(current.cart.updatedAt);
  if (nextUpdatedAt !== currentUpdatedAt) return nextUpdatedAt > currentUpdatedAt;

  if (next.cart.id !== current.cart.id) return next.id > current.id;
  if (next.cart.totalQuantity !== current.cart.totalQuantity) {
    return next.cart.totalQuantity > current.cart.totalQuantity;
  }

  return next.id > current.id;
}

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) throw new Error('useAside must be used within an AsideProvider');
  return aside;
}
