import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {CollectionProductFragment} from 'storefrontapi.generated';
import {WishlistToggle} from '~/components/WishlistToggle';
import {useVariantUrl} from '~/lib/variants';

export function CollectionProductCard({
  initialSaved = false,
  linkTo,
  loading,
  product,
}: {
  initialSaved?: boolean;
  linkTo?: string;
  loading?: 'eager' | 'lazy';
  product: CollectionProductFragment;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const productUrl = linkTo ?? variantUrl;
  const selectedVariant = product.selectedOrFirstAvailableVariant;
  const badge = getBadge(product.tags);
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const isSale = Boolean(
    compareAtPrice && Number(compareAtPrice.amount) > Number(price.amount),
  );
  const isAvailable = Boolean(
    product.availableForSale && selectedVariant?.availableForSale,
  );

  return (
    <article className="collection-product-card">
      <div className="collection-product-card-media-wrap">
        <Link
          aria-label={`View ${product.title}`}
          className="collection-product-card-media"
          prefetch="intent"
          to={productUrl}
        >
          {product.featuredImage ? (
            <Image
              alt={product.featuredImage.altText || product.title}
              aspectRatio="3/4"
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 1200px) 22vw, (min-width: 768px) 29vw, 46vw"
            />
          ) : (
            <span className="collection-image-placeholder">Product Photo</span>
          )}
          {badge ? (
            <span className="collection-product-badge">{badge}</span>
          ) : null}
        </Link>
        <WishlistToggle
          className="collection-wishlist-toggle"
          initialSaved={initialSaved}
          productId={product.id}
        />
        {!isAvailable ? (
          <div className="collection-product-sold-out" role="status">
            <span>Sold Out</span>
          </div>
        ) : null}
      </div>

      <div className="collection-product-card-details">
        <Link
          className="collection-product-card-title"
          prefetch="intent"
          to={productUrl}
        >
          {product.title}
        </Link>
        <div className="collection-product-card-price">
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
      </div>
    </article>
  );
}

function getBadge(tags: string[]) {
  const tag = tags.find((value) =>
    /^(new|best seller|bestseller|sale)$/i.test(value.trim()),
  );
  if (!tag) return null;
  return tag.toLowerCase() === 'bestseller' ? 'Best Seller' : tag;
}
