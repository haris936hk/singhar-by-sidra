import {useFetcher} from 'react-router';
import type {WishlistActionResponse} from '~/lib/wishlist';

export function WishlistToggle({
  className,
  initialSaved = false,
  productId,
}: {
  className?: string;
  initialSaved?: boolean;
  productId: string;
}) {
  const fetcher = useFetcher<WishlistActionResponse>();
  const isSubmitting = fetcher.state !== 'idle';
  const response = fetcher.data;
  const hasServerState =
    response?.productId === productId &&
    response.error === null &&
    typeof response.saved === 'boolean';
  const saved = hasServerState ? response.saved === true : initialSaved;
  const error = response?.productId === productId ? response.error : null;

  return (
    <fetcher.Form
      action="/account/wishlist"
      className={`wishlist-toggle-form${className ? ` ${className}` : ''}`}
      method="post"
    >
      <input
        name="intent"
        type="hidden"
        value={saved ? 'remove' : 'add'}
      />
      <input name="productId" type="hidden" value={productId} />
      <button
        aria-busy={isSubmitting}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        className={saved ? 'wishlist-toggle is-saved' : 'wishlist-toggle'}
        disabled={isSubmitting}
        type="submit"
      >
        <HeartIcon filled={saved} />
      </button>
      {error ? (
        <span className="wishlist-toggle-error" role="alert">
          {error}
        </span>
      ) : null}
    </fetcher.Form>
  );
}

function HeartIcon({filled}: {filled: boolean}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M20.8 8.7c0 5.4-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.7A4.5 4.5 0 0 1 12 6.4a4.5 4.5 0 0 1 8.8 2.3Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}
