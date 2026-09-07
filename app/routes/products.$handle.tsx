import {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {Await, Link, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  getSelectedProductOptions,
  Image,
  Money,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import type {MappedProductOptions} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  return [
    {title: product?.seo.title || product?.title || 'Singhar by Sidra'},
    ...(product?.seo.description
      ? [{name: 'description', content: product.seo.description}]
      : []),
    {rel: 'canonical', href: `/products/${product?.handle ?? ''}`},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const recommendations = loadDeferredData(args, criticalData.product.id);
  return {...criticalData, recommendations};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      displayName: 'Product',
    }),
  ]);

  if (!product?.id) throw new Response(null, {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: product});
  return {product};
}

function loadDeferredData({context}: Route.LoaderArgs, productId: string) {
  const {storefront} = context;
  return storefront
    .query(RECOMMENDATIONS_QUERY, {
      variables: {productId},
      cache: storefront.CacheLong(),
      displayName: 'Product recommendations',
    })
    .then(({productRecommendations, errors}) => {
      if (errors?.length) console.error('Product recommendations query failed', errors);
      return {recommendations: productRecommendations ?? []};
    })
    .catch((error: unknown) => {
      console.error('Product recommendations request failed', error);
      return {recommendations: []};
    });
}

export default function Product() {
  const {product, recommendations} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });
  const gallery = getGalleryImages(product.media.nodes, selectedVariant?.image);

  return (
    <div className="pdp-page">
      <Breadcrumbs title={product.title} />
      <div className="pdp-main">
        <ProductGallery images={gallery} title={product.title} />
        <ProductBuyBox
          descriptionHtml={product.descriptionHtml}
          product={product}
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
      </div>
      <Recommendations recommendations={recommendations} />
      <Analytics.ProductView
        data={{
          products: [{
            id: product.id,
            title: product.title,
            price: selectedVariant?.price.amount || '0',
            vendor: product.vendor,
            variantId: selectedVariant?.id || '',
            variantTitle: selectedVariant?.title || '',
            quantity: 1,
          }],
        }}
      />
    </div>
  );
}

function Breadcrumbs({title}: {title: string}) {
  return (
    <nav aria-label="Breadcrumb" className="pdp-breadcrumbs">
      <Link to="/">Home</Link><span aria-hidden>/</span>
      <Link to="/collections">Luxury Pret</Link><span aria-hidden>/</span>
      <span aria-current="page">{title}</span>
    </nav>
  );
}

type GalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  isVideo: boolean;
};

type GallerySource = Omit<GalleryImage, 'id' | 'isVideo'> & {id?: string | null};

function getGalleryImages(
  media: Array<{__typename?: string; id: string; image?: GallerySource | null; previewImage?: GallerySource | null}>,
  selectedImage?: GallerySource | null,
) {
  const images = media.flatMap((item) => {
    const image = item.image ?? item.previewImage;
    return image ? [{...image, id: image.id ?? item.id, isVideo: item.__typename !== 'MediaImage'}] : [];
  });
  if (images.length) return images;
  return selectedImage ? [{...selectedImage, id: selectedImage.id ?? 'selected-image', isVideo: false}] : [];
}

function ProductGallery({images, title}: {images: GalleryImage[]; title: string}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => {
    if (!zoomed) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [zoomed]);

  const selectImage = (index: number) => {
    setActiveIndex(index);
    mobileGalleryRef.current?.children[index]?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
  };

  if (!activeImage) return <div className="pdp-gallery-empty">No product images available.</div>;

  return (
    <section aria-label={`${title} images`} className="pdp-gallery">
      <div className="pdp-gallery-mobile" ref={mobileGalleryRef} onScroll={(event) => {
        const element = event.currentTarget;
        const nextIndex = Math.round(element.scrollLeft / element.clientWidth);
        if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
      }}>
        {images.map((image, index) => (
          <button aria-label={`View product image ${index + 1}`} className="pdp-gallery-mobile-slide" key={image.id} onClick={() => setZoomed(true)} type="button">
            <Image alt={image.altText || title} data={image} sizes="100vw" />
            {image.isVideo ? <span className="pdp-video-badge" aria-hidden>▶</span> : null}
          </button>
        ))}
      </div>

      <div className="pdp-gallery-desktop">
        <div aria-label="Product image thumbnails" className="pdp-gallery-thumbs" role="list">
          {images.map((image, index) => (
            <button aria-current={index === activeIndex ? 'true' : undefined} aria-label={`View product image ${index + 1}`} className={`pdp-gallery-thumb${index === activeIndex ? ' is-active' : ''}`} key={image.id} onClick={() => selectImage(index)} type="button">
              <Image alt="" data={image} sizes="76px" />
              {image.isVideo ? <span className="pdp-video-badge" aria-hidden>▶</span> : null}
            </button>
          ))}
        </div>
        <div aria-label="Product image zoom" className="pdp-gallery-main" onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)} onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setZoomOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
        }}>
          <Image alt={activeImage.altText || title} className={zoomed ? 'is-zoomed' : undefined} data={activeImage} sizes="(min-width: 768px) 520px, 100vw" style={{transformOrigin: zoomOrigin}} />
          {activeImage.isVideo ? <span className="pdp-video-badge" aria-hidden>▶</span> : null}
        </div>
      </div>

      <div aria-label="Product image pages" className="pdp-gallery-dots" role="tablist">
        {images.map((image, index) => (
          <button aria-label={`View product image ${index + 1}`} aria-selected={index === activeIndex} className={index === activeIndex ? 'is-active' : undefined} key={image.id} onClick={() => selectImage(index)} role="tab" type="button" />
        ))}
      </div>
      {zoomed ? <button aria-label="Close enlarged product image" className="pdp-mobile-zoom" onClick={() => setZoomed(false)} type="button"><Image alt={activeImage.altText || title} data={activeImage} sizes="100vw" /></button> : null}
    </section>
  );
}

function ProductBuyBox({descriptionHtml, product, productOptions, selectedVariant}: {
  descriptionHtml: string;
  product: Awaited<ReturnType<typeof loadCriticalData>>['product'];
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const {open} = useAside();
  const [openAccordion, setOpenAccordion] = useState(0);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const purchaseAreaRef = useRef<HTMLDivElement>(null);
  const accordionSections = useMemo(() => [
    {title: 'Description', body: descriptionHtml, html: true},
    {title: 'Care Instructions', body: 'Follow the care instructions supplied with your order. Store embellished pieces away from direct sunlight and moisture.'},
  ], [descriptionHtml]);
  const lines = selectedVariant ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}] : [];

  useEffect(() => {
    const purchaseArea = purchaseAreaRef.current;
    if (!purchaseArea) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyCart(!entry.isIntersecting);
    }, {threshold: 0.1});
    observer.observe(purchaseArea);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="pdp-buy-box">
      <div ref={purchaseAreaRef} className="pdp-purchase-area">
        <div className="pdp-title-block">
          <h1>{product.title}</h1>
          <span className="pdp-price">{selectedVariant?.price ? <Money data={selectedVariant.price} withoutTrailingZeros /> : null}</span>
        </div>
        <ProductForm className="pdp-product-form" productOptions={productOptions} />
        <div className="pdp-action-row">
          <AddToCartButton className="pdp-add-to-cart" disabled={!selectedVariant?.availableForSale} lines={lines} onClick={() => open('cart')}>{selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}</AddToCartButton>
        </div>
        <TrustBadges />
      </div>
      <div className="pdp-accordions">
        {accordionSections.map((section, index) => {
          const expanded = openAccordion === index;
          return (
            <div className="pdp-accordion" key={section.title}>
              <button aria-controls={`pdp-panel-${index}`} aria-expanded={expanded} onClick={() => setOpenAccordion(expanded ? -1 : index)} type="button"><span>{section.title}</span><span aria-hidden className={expanded ? 'is-open' : undefined}>+</span></button>
              {expanded ? <div className="pdp-accordion-panel" id={`pdp-panel-${index}`}>
                {section.html ? <div dangerouslySetInnerHTML={{__html: section.body}} /> : <p>{section.body}</p>}
              </div> : null}
            </div>
          );
        })}
      </div>
      <div className={`pdp-sticky-cart${showStickyCart ? ' is-visible' : ''}`}>
        <div><span>{product.title}</span><strong>{selectedVariant?.price ? <Money data={selectedVariant.price} withoutTrailingZeros /> : null}</strong></div>
        <AddToCartButton className="pdp-sticky-cart-button" disabled={!selectedVariant?.availableForSale} lines={lines} onClick={() => open('cart')}>{selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}</AddToCartButton>
      </div>
    </section>
  );
}

function TrustBadges() {
  return <div aria-label="Shopping assurances" className="pdp-trust-grid">
    {['Secure Payment', 'Easy Returns', 'Cash on Delivery', '100% Authentic'].map((badge) => <div key={badge}><span aria-hidden>✓</span><p>{badge}</p></div>)}
  </div>;
}

function Recommendations({recommendations}: {recommendations: ReturnType<typeof loadDeferredData>}) {
  return <Suspense fallback={null}><Await resolve={recommendations}>{(data) => data.recommendations.length ? (
    <section aria-labelledby="pdp-recommendations-title" className="pdp-recommendations">
      <h2 id="pdp-recommendations-title">You May Also Like</h2>
      <div className="pdp-recommendation-grid">
        {data.recommendations.slice(0, 4).map((recommendation) => {
          const variant = recommendation.selectedOrFirstAvailableVariant;
          const image = variant?.image ?? recommendation.featuredImage;
          return <Link className="pdp-recommendation-card" key={recommendation.id} prefetch="intent" to={`/products/${recommendation.handle}`}>
            <div className="pdp-recommendation-image">{image ? <Image alt={image.altText || recommendation.title} data={image} loading="lazy" sizes="(min-width: 768px) 25vw, 50vw" /> : null}</div>
            <h3>{recommendation.title}</h3>
            {variant?.price ? <Money data={variant.price} withoutTrailingZeros /> : null}
          </Link>;
        })}
      </div>
    </section>
  ) : null}</Await></Suspense>;
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice { amount currencyCode }
    id
    image { __typename id url altText width height }
    price { amount currencyCode }
    product { title handle }
    selectedOptions { name value }
    sku
    title
    unitPrice { amount currencyCode }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    media(first: 7) {
      nodes {
        __typename
        id
        previewImage { id url altText width height }
        ... on MediaImage { image { id url altText width height } }
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant { ...ProductVariant }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) { ...ProductVariant }
    adjacentVariants(selectedOptions: $selectedOptions) { ...ProductVariant }
    seo { description title }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product($country: CountryCode, $handle: String!, $language: LanguageCode, $selectedOptions: [SelectedOptionInput!]!) @inContext(country: $country, language: $language) {
    product(handle: $handle) { ...Product }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations($country: CountryCode, $language: LanguageCode, $productId: ID!) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: RELATED) {
      id
      title
      handle
      featuredImage { id url altText width height }
      selectedOrFirstAvailableVariant { availableForSale image { id url altText width height } price { amount currencyCode } }
    }
  }
` as const;
