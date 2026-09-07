import {Suspense, useId} from 'react';
import {useOptimisticCart} from '@shopify/hydrogen';
import {Await, Form, Link, useLocation} from 'react-router';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {siteConfig} from '~/lib/site-config';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  currentYear: number;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
  currentYear,
}: PageLayoutProps) {
  const location = useLocation();

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside header={header} />
      <AccountAside isLoggedIn={isLoggedIn} />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      <Header
        cartPage={location.pathname === '/cart'}
        header={header}
        cart={cart}
        publicStoreDomain={publicStoreDomain}
      />
      <main id="main-content">{children}</main>
      <Footer
        cartPage={location.pathname === '/cart'}
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
        currentYear={currentYear}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside
      type="cart"
      heading={
        <Suspense fallback="Your Bag">
          <Await resolve={cart} errorElement="Your Bag">
            {(resolved) => <CartAsideHeading cart={resolved} />}
          </Await>
        </Suspense>
      }
    >
      <Suspense fallback={<CartSkeleton />}>
        <Await resolve={cart} errorElement={<CartError />}>
          {(resolved) => <CartMain cart={resolved} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function CartAsideHeading({cart}: {cart: CartApiQueryFragment | null}) {
  const optimisticCart = useOptimisticCart(cart);

  return <>Your Bag ({optimisticCart?.totalQuantity ?? 0})</>;
}

function CartSkeleton() {
  return (
    <div aria-live="polite" className="cart-skeleton">
      <p>Loading your bag…</p>
      <div />
      <div />
    </div>
  );
}

function CartError() {
  return (
    <div className="empty-state" role="alert">
      <h3>We couldn’t load your bag</h3>
      <p>Please close this panel and try again.</p>
    </div>
  );
}

function SearchAside({header}: {header: HeaderQuery}) {
  const queriesDatalistId = useId();
  const {close} = useAside();
  const collectionCards = (header.menu?.items ?? [])
    .flatMap((item) => {
      const candidates = [item, ...(item.items ?? [])];
      return candidates.flatMap((candidate) => {
        const resource = candidate.resource;
        return resource && 'image' in resource && resource.image
          ? [{...resource, image: resource.image}]
          : [];
      });
    })
    .slice(0, 4);

  return (
    <Aside type="search" heading="Search">
      <div className="search-overlay-content">
        <SearchFormPredictive className="search-overlay-form">
          {({fetchResults, inputRef}) => (
            <>
              <button
                aria-label="Close search"
                className="search-overlay-close"
                onClick={close}
                type="button"
              />
              <label className="sr-only" htmlFor="site-search">
                Search the store
              </label>
              <input
                autoComplete="off"
                data-autofocus
                id="site-search"
                list={queriesDatalistId}
                name="q"
                onChange={fetchResults}
                placeholder="Search sarees, lehengas, kurtas..."
                ref={inputRef}
                type="search"
              />
            </>
          )}
        </SearchFormPredictive>
        <div className="search-overlay-body">
          <SearchResultsPredictive>
            {({items, total, term, state, closeSearch, fetcher}) => {
              const {articles, collections, pages, products, queries} = items;
              if (state !== 'idle') return <SearchSkeleton />;
              if (fetcher.data?.error)
                return (
                  <div className="search-message" role="alert">
                    <h3>Search is temporarily unavailable</h3>
                    <p>Please try again in a moment.</p>
                  </div>
                );
              if (!term.current)
                return <SearchDiscovery collectionCards={collectionCards} />;
              if (!total) return <SearchResultsPredictive.Empty term={term} />;
              return (
                <div className="search-results-wrap">
                  <SearchResultsPredictive.Queries
                    queries={queries}
                    queriesDatalistId={queriesDatalistId}
                  />
                  <SearchResultsPredictive.Products
                    products={products}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Collections
                    collections={collections}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Pages
                    pages={pages}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Articles
                    articles={articles}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <Link
                    className="view-all-search"
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term.current)}`}
                  >
                    View all results for “{term.current}” →
                  </Link>
                </div>
              );
            }}
          </SearchResultsPredictive>
        </div>
      </div>
    </Aside>
  );
}

function SearchSkeleton() {
  return (
    <div aria-live="polite" className="search-skeleton">
      <span className="sr-only">Loading search results</span>
      {Array.from({length: 4}, (_, index) => (
        <div key={index} />
      ))}
    </div>
  );
}

function SearchDiscovery({
  collectionCards,
}: {
  collectionCards: Array<{
    id: string;
    handle: string;
    title: string;
    image: {url: string; altText?: string | null};
  }>;
}) {
  const {close} = useAside();
  return (
    <div className="search-discovery">
      <section>
        <h3>Trending searches</h3>
        <div className="trending-links">
          {siteConfig.homepage.trendingSearches.map((term) => (
            <Link
              key={term}
              onClick={close}
              to={`/search?q=${encodeURIComponent(term)}`}
            >
              {term}
            </Link>
          ))}
        </div>
      </section>
      {collectionCards.length ? (
        <section>
          <h3>Shop collections</h3>
          <div className="search-collection-grid">
            {collectionCards.map((collection) => (
              <Link
                key={collection.id}
                onClick={close}
                to={`/collections/${collection.handle}`}
              >
                <img
                  alt={collection.image.altText || collection.title}
                  height="180"
                  loading="lazy"
                  src={collection.image.url}
                  width="140"
                />
                <span>{collection.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AccountAside({isLoggedIn}: {isLoggedIn: Promise<boolean>}) {
  return (
    <Aside type="account" heading="My Account">
      <Suspense fallback={<p aria-live="polite">Checking account…</p>}>
        <Await resolve={isLoggedIn} errorElement={<LoggedOutAccount />}>
          {(loggedIn) =>
            loggedIn ? <LoggedInAccount /> : <LoggedOutAccount />
          }
        </Await>
      </Suspense>
    </Aside>
  );
}

function LoggedOutAccount() {
  return (
    <div className="account-panel">
      <p>Sign in to view your orders and manage your details.</p>
      <Link className="button button-dark" to="/account/login">
        Log in or create account
      </Link>
    </div>
  );
}

function LoggedInAccount() {
  return (
    <nav aria-label="Account" className="account-panel account-links">
      <Link to="/account/orders">Orders</Link>
      <Link to="/account/profile">Profile</Link>
      <Link to="/account/addresses">Addresses</Link>
      <Form action="/account/logout" method="POST">
        <button type="submit">Log out</button>
      </Form>
    </nav>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: HeaderQuery;
  publicStoreDomain: string;
}) {
  return (
    <Aside type="mobile" heading="Menu">
      <HeaderMenu
        menu={header.menu}
        viewport="mobile"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside>
  );
}
