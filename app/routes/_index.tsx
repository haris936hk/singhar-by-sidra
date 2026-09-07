import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, Link, useLoaderData} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {HomepageCollectionFragment, HomepageProductCardFragment} from 'storefrontapi.generated';
import type {Route} from './+types/_index';
import {MockShopNotice} from '~/components/MockShopNotice';
import {siteConfig, type EditorialAsset} from '~/lib/site-config';

export const meta: Route.MetaFunction = () => [
  {title: siteConfig.seo.title},
  {name: 'description', content: siteConfig.seo.description},
  {tagName: 'link', rel: 'canonical', href: '/'},
  {property: 'og:title', content: siteConfig.seo.title},
  {property: 'og:description', content: siteConfig.seo.description},
  {property: 'og:image', content: siteConfig.homepage.hero.desktopSrc},
];

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const heroCollection = await context.storefront.query(HERO_COLLECTION_QUERY, {
    cache: context.storefront.CacheLong(),
    variables: {handle: siteConfig.homepage.hero.collectionHandle},
  }).then((response) => response.collection).catch((error: Error) => {
    console.error('Homepage hero collection failed', error);
    return null;
  });
  return {isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN), heroCollection};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const featuredCollections = storefront.query(HOMEPAGE_COLLECTIONS_QUERY, {
    cache: storefront.CacheLong(),
  }).then((response) => [response.luxuryPret, response.wedding, response.eid, response.festive].filter((collection): collection is HomepageCollectionFragment => Boolean(collection))).catch((error: Error) => {
    console.error('Homepage featured collections failed', error);
    return null;
  });
  const newArrivals = storefront.query(HOMEPAGE_NEW_ARRIVALS_QUERY, {
    cache: storefront.CacheShort(),
  }).then((response) => response.products.nodes).catch((error: Error) => {
    console.error('Homepage new arrivals failed', error);
    return null;
  });
  const bestSellers = storefront.query(HOMEPAGE_BEST_SELLERS_QUERY, {
    cache: storefront.CacheShort(),
  }).then((response) => response.products.nodes).catch((error: Error) => {
    console.error('Homepage best sellers failed', error);
    return null;
  });
  return {featuredCollections, newArrivals, bestSellers};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const heroHref = data.heroCollection ? `/collections/${data.heroCollection.handle}` : '/collections/all';
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero href={heroHref} />
      <ProductCarousel badge="New" products={data.newArrivals} title="New Arrivals" viewAll={heroHref} eager />
      <FeaturedCollections collections={data.featuredCollections} />
      <ProductCarousel badge="Bestseller" products={data.bestSellers} title="Best Sellers" viewAll="/collections/all" />
      <EditorialBanner />
      <SizeGuide />
      <Testimonials />
      <Instagram />
      <Newsletter />
    </div>
  );
}

function Hero({href}: {href: string}) {
  const hero = siteConfig.homepage.hero;
  return (
    <section className="home-hero">
      <EditorialPicture asset={hero} className="home-hero-media" eager />
      <div className="home-hero-shade" />
      <div className="home-hero-copy">
        <p>{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        <span>{hero.copy}</span>
        <Link className="button button-gold" prefetch="intent" to={href}>Shop New Arrivals</Link>
      </div>
    </section>
  );
}

function ProductCarousel({products, title, viewAll, badge, eager = false}: {
  products: Promise<HomepageProductCardFragment[] | null>;
  title: string;
  viewAll: string;
  badge: string;
  eager?: boolean;
}) {
  return (
    <section aria-label={title} className="home-section product-carousel-section">
      <Suspense fallback={<CarouselSkeleton title={title} />}>
        <Await resolve={products}>{(resolved) => resolved?.length ? <CarouselContent badge={badge} eager={eager} products={resolved} title={title} viewAll={viewAll} /> : null}</Await>
      </Suspense>
    </section>
  );
}

function CarouselContent({products, title, viewAll, badge, eager}: {products: HomepageProductCardFragment[]; title: string; viewAll: string; badge: string; eager: boolean}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({start: true, end: false});
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => setBounds({start: rail.scrollLeft <= 2, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2});
    update();
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener('scroll', update, {passive: true});
    return () => {observer.disconnect(); rail.removeEventListener('scroll', update);};
  }, [products.length]);
  const scroll = (direction: number) => railRef.current?.scrollBy({left: direction * Math.min(616, railRef.current.clientWidth), behavior: 'smooth'});
  return (
    <>
      <div className="section-heading"><h2>{title}</h2><div><Link prefetch="intent" to={viewAll}>View All →</Link><span className="carousel-buttons"><button aria-label={`Previous ${title}`} disabled={bounds.start} onClick={() => scroll(-1)}><ArrowIcon direction="left" /></button><button aria-label={`Next ${title}`} disabled={bounds.end} onClick={() => scroll(1)}><ArrowIcon direction="right" /></button></span></div></div>
      <div className="product-rail hide-scrollbar" ref={railRef}>{products.map((product, index) => <HomeProductCard badge={badge} eager={eager && index < 2} key={product.id} product={product} />)}</div>
    </>
  );
}

function HomeProductCard({product, badge, eager}: {product: HomepageProductCardFragment; badge: string; eager: boolean}) {
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image ?? product.featuredImage;
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice;
  const onSale = Boolean(compareAt && Number(compareAt.amount) > Number(price.amount));
  return (
    <Link className="home-product-card" prefetch="intent" to={`/products/${product.handle}`}>
      <div className="home-product-image">
        {image ? <Image alt={image.altText || product.title} aspectRatio="3/4" data={image} loading={eager ? 'eager' : 'lazy'} sizes="(min-width: 768px) 280px, 160px" /> : <div className="image-placeholder" />}
        <span className="product-badge">{onSale ? 'Sale' : badge}</span>
        {!product.availableForSale || variant?.availableForSale === false ? <span className="sold-out">Sold out</span> : null}
      </div>
      <h3>{product.title}</h3>
      <div className={onSale ? 'card-price sale-price' : 'card-price'}><Money data={price} withoutTrailingZeros />{onSale && compareAt ? <s><Money data={compareAt} withoutTrailingZeros /></s> : null}</div>
    </Link>
  );
}

function FeaturedCollections({collections}: {collections: Promise<HomepageCollectionFragment[] | null>}) {
  return (
    <Suspense fallback={null}><Await resolve={collections}>{(resolved) => resolved?.length ? <section className="home-section featured-collections"><div className="section-heading"><h2>Featured Collections</h2></div><div className="collection-grid">{resolved.map((collection) => {
      const config = siteConfig.homepage.featuredCollections.find((item) => item.handle === collection.handle);
      return <Link key={collection.id} prefetch="intent" to={`/collections/${collection.handle}`}><div>{collection.image ? <Image alt={collection.image.altText || collection.title} aspectRatio="3/4" data={collection.image} loading="lazy" sizes="(min-width: 768px) 25vw, 50vw" /> : <div className="image-placeholder" />}<span /></div><h3>{config?.title ?? collection.title}</h3><p>{config?.subtitle}</p></Link>;
    })}</div></section> : null}</Await></Suspense>
  );
}

function EditorialBanner() {
  const editorial = siteConfig.homepage.editorial;
  return <Link className="editorial-banner" prefetch="intent" to="/collections/all"><EditorialPicture asset={editorial} className="editorial-media" /><span className="editorial-shade" /><span className="editorial-copy"><strong>{editorial.title}</strong><em>{editorial.cta}</em></span></Link>;
}

function SizeGuide() {
  const guide = siteConfig.homepage.sizeGuide;
  return <Link className="size-guide" prefetch="intent" to={guide.href}><EditorialPicture asset={guide} className="size-guide-media" /><span className="size-guide-copy"><strong>{guide.title}</strong><span>{guide.copy}</span><em>View Size Guide</em></span></Link>;
}

function EditorialPicture({asset, className, eager = false}: {asset: EditorialAsset; className: string; eager?: boolean}) {
  return <picture className={className}><source media="(max-width: 767px)" srcSet={asset.mobileSrc} /><img alt={asset.alt} decoding="async" height={asset.desktopHeight} loading={eager ? 'eager' : 'lazy'} onError={(event) => {event.currentTarget.hidden = true;}} src={asset.desktopSrc} width={asset.desktopWidth} /></picture>;
}

function Testimonials() {
  const testimonials = siteConfig.homepage.testimonials;
  const [index, setIndex] = useState(0);
  const active = testimonials[index];
  const select = (next: number) => setIndex((next + testimonials.length) % testimonials.length);
  return <section aria-label="Customer testimonials" className="testimonials"><span aria-hidden className="quote-mark">“</span><blockquote aria-live="polite"><p>{active.quote}</p><footer><strong>{active.name}</strong><span>{active.city}</span></footer></blockquote><div className="testimonial-controls"><button aria-label="Previous testimonial" onClick={() => select(index - 1)}><ArrowIcon direction="left" /></button><div>{testimonials.map((testimonial, dotIndex) => <button aria-label={`Show testimonial from ${testimonial.name}`} aria-pressed={dotIndex === index} className={dotIndex === index ? 'active' : ''} key={testimonial.name} onClick={() => select(dotIndex)} />)}</div><button aria-label="Next testimonial" onClick={() => select(index + 1)}><ArrowIcon direction="right" /></button></div></section>;
}

function Instagram() {
  const posts = siteConfig.marketing.instagram;
  if (!posts || posts.length !== 6 || posts.some((post) => !post.href || !post.image || !post.alt)) return null;
  return <section className="home-section instagram"><h2>@singharbysidra</h2><div>{posts.map((post) => <a href={post.href} key={post.href} rel="noopener noreferrer" target="_blank"><img alt={post.alt} height="220" loading="lazy" src={post.image} width="220" /></a>)}</div></section>;
}

function Newsletter() {
  const newsletter = siteConfig.marketing.newsletter;
  if (!newsletter || !newsletter.endpoint.startsWith('https://') || !newsletter.privacyCopy) return null;
  return <section className="newsletter"><h2>Stay In Style</h2><p>Be the first to know about new collections and exclusive previews.</p><form action={newsletter.endpoint} method="POST"><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input autoComplete="email" id="newsletter-email" name="email" placeholder="Your email address" required type="email" /><button className="button button-dark" type="submit">Subscribe</button></form><small>{newsletter.privacyCopy}</small></section>;
}

function CarouselSkeleton({title}: {title: string}) {
  return <><div className="section-heading"><h2>{title}</h2></div><div aria-live="polite" className="product-rail carousel-skeleton"><span className="sr-only">Loading {title}</span>{Array.from({length: 4}, (_, index) => <div key={index}><span /><i /><i /></div>)}</div></>;
}

function ArrowIcon({direction}: {direction: 'left' | 'right'}) {
  return <svg aria-hidden viewBox="0 0 16 16"><path d={direction === 'right' ? 'm5.5 3 5 5-5 5' : 'm10.5 3-5 5 5 5'} /></svg>;
}

const HOMEPAGE_PRODUCT_FRAGMENT = `#graphql
  fragment HomepageProductCard on Product {
    id
    handle
    title
    availableForSale
    featuredImage { id url altText width height }
    priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      id
      availableForSale
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      image { id url altText width height }
    }
  }
` as const;

const HERO_COLLECTION_QUERY = `#graphql
  query HomepageHeroCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) { id handle }
  }
` as const;

const HOMEPAGE_COLLECTIONS_QUERY = `#graphql
  fragment HomepageCollection on Collection { id handle title image { id url altText width height } }
  query HomepageCollections($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    luxuryPret: collection(handle: "luxury-pret") { ...HomepageCollection }
    wedding: collection(handle: "wedding-collection") { ...HomepageCollection }
    eid: collection(handle: "eid-collection") { ...HomepageCollection }
    festive: collection(handle: "festive-collection") { ...HomepageCollection }
  }
` as const;

const HOMEPAGE_NEW_ARRIVALS_QUERY = `#graphql
  query HomepageNewArrivals($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) { nodes { ...HomepageProductCard } }
  }
  ${HOMEPAGE_PRODUCT_FRAGMENT}
` as const;

const HOMEPAGE_BEST_SELLERS_QUERY = `#graphql
  query HomepageBestSellers($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING) { nodes { ...HomepageProductCard } }
  }
  ${HOMEPAGE_PRODUCT_FRAGMENT}
` as const;
