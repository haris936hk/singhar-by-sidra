import {Suspense, useEffect, useId, useState} from 'react';
import {Await, Link, useLocation} from 'react-router';
import {Image, type CartViewPayload, useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {normalizeMenuUrl} from '~/lib/menu';
import {siteConfig} from '~/lib/site-config';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  publicStoreDomain: string;
}

type MenuItem = {
  id: string;
  title: string;
  url?: string | null;
  items?: MenuItem[];
  resource?: null | {
    id: string;
    handle: string;
    title: string;
    image?: null | {id?: string; url: string; altText?: string | null; width?: number | null; height?: number | null};
  };
};
type Viewport = 'desktop' | 'mobile';

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {open} = useAside();
  return (
    <>
      <div className="announcement-bar">
        <span className="announcement-mobile">{siteConfig.announcement.mobile}</span>
        <span className="announcement-desktop">{siteConfig.announcement.desktop}</span>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <button aria-label="Open menu" className="icon-button mobile-only" onClick={() => open('mobile')}>
            <MenuIcon />
          </button>
          <BrandLockup />
          <HeaderMenu menu={header.menu} viewport="desktop" primaryDomainUrl={header.shop.primaryDomain.url} publicStoreDomain={publicStoreDomain} />
          <HeaderActions cart={cart} />
        </div>
      </header>
    </>
  );
}

function BrandLockup() {
  return (
    <Link aria-label="Singhar by Sidra home" className="brand-lockup" prefetch="intent" to="/">
      <span lang="ur">{siteConfig.brand.urdu}</span>
      <strong>{siteConfig.brand.english}</strong>
    </Link>
  );
}

export function HeaderMenu({menu, primaryDomainUrl, viewport, publicStoreDomain}: {
  menu: HeaderQuery['menu'];
  primaryDomainUrl: string;
  viewport: Viewport;
  publicStoreDomain: string;
}) {
  const items = (menu?.items.length ? menu.items : fallbackMenu) as unknown as MenuItem[];
  const {close} = useAside();
  const location = useLocation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<Set<string>>(() => new Set());
  const navId = useId();

  useEffect(() => {
    setActiveId(null);
    if (viewport === 'mobile') close();
  }, [close, location.pathname, location.search, viewport]);

  useEffect(() => {
    if (!activeId) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeId]);

  if (viewport === 'mobile') {
    return (
      <nav aria-label="Mobile navigation" className="mobile-menu">
        {items.map((item) => {
          const children = item.items ?? [];
          const expanded = expandedMobile.has(item.id);
          return (
            <div className="mobile-menu-group" key={item.id}>
              <div className="mobile-menu-row">
                <MenuLink item={item} domains={[publicStoreDomain, primaryDomainUrl]} onNavigate={close} />
                {children.length ? (
                  <button aria-controls={`${navId}-${item.id}`} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.title}`} onClick={() => setExpandedMobile((current) => {
                    const next = new Set(current);
                    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                    return next;
                  })}>
                    <ChevronIcon direction={expanded ? 'up' : 'down'} />
                  </button>
                ) : null}
              </div>
              {children.length ? (
                <div className="mobile-submenu" hidden={!expanded} id={`${navId}-${item.id}`}>
                  {children.map((child) => <MenuLink domains={[publicStoreDomain, primaryDomainUrl]} item={child} key={child.id} onNavigate={close} />)}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Primary navigation" className="desktop-menu" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setActiveId(null);
    }} onMouseLeave={() => setActiveId(null)}>
      {items.map((item) => {
        const children = item.items ?? [];
        const expanded = activeId === item.id;
        const panelId = `${navId}-${item.id}`;
        return (
          <div className="desktop-menu-group" key={item.id} onMouseEnter={() => children.length && setActiveId(item.id)}>
            <div className="desktop-menu-trigger">
              <MenuLink domains={[publicStoreDomain, primaryDomainUrl]} item={item} onNavigate={() => setActiveId(null)} />
              {children.length ? (
                <button aria-controls={panelId} aria-expanded={expanded} aria-label={`Open ${item.title} menu`} onClick={() => setActiveId(expanded ? null : item.id)} onKeyDown={(event) => {
                  if (event.key === 'Escape') setActiveId(null);
                }}>
                  <ChevronIcon direction="down" />
                </button>
              ) : null}
            </div>
            {children.length ? (
              <div className="mega-menu" hidden={!expanded} id={panelId}>
                <div className="mega-menu-inner">
                  <div className="mega-menu-links">
                    <p>{item.title}</p>
                    {children.map((child) => <MenuLink domains={[publicStoreDomain, primaryDomainUrl]} item={child} key={child.id} onNavigate={() => setActiveId(null)} />)}
                  </div>
                  <MegaMenuImage item={item} />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function MegaMenuImage({item}: {item: MenuItem}) {
  const resource = item.resource ?? item.items?.find((child) => child.resource)?.resource;
  if (!resource || !('image' in resource) || !resource.image) return null;
  return (
    <div className="mega-menu-promo">
      <Image src={resource.image.url} alt={resource.image.altText || resource.title} height={resource.image.height ?? 150} width={resource.image.width ?? 220} sizes="220px" />
      <span>{resource.title}</span>
    </div>
  );
}

function MenuLink({item, domains, onNavigate}: {item: MenuItem; domains: string[]; onNavigate: () => void}) {
  if (!item.url) return <span>{item.title}</span>;
  const normalized = normalizeMenuUrl(item.url, domains);
  return normalized.external ? (
    <a href={normalized.url} rel="noopener noreferrer" target="_blank">{item.title}</a>
  ) : (
    <Link onClick={onNavigate} prefetch="intent" to={normalized.url}>{item.title}</Link>
  );
}

function HeaderActions({cart}: {cart: HeaderProps['cart']}) {
  const {open} = useAside();
  return (
    <nav aria-label="Store actions" className="header-actions">
      <button aria-label="Search" className="icon-button" onClick={() => open('search')}><SearchIcon /></button>
      <button aria-label="Account" className="icon-button" onClick={() => open('account')}><AccountIcon /></button>
      <Suspense fallback={<CartButton count={0} />}>
        <Await resolve={cart}>{(resolved) => <OptimisticCartButton cart={resolved} />}</Await>
      </Suspense>
    </nav>
  );
}

function OptimisticCartButton({cart: originalCart}: {cart: CartApiQueryFragment | null}) {
  const cart = useOptimisticCart(originalCart);
  return <CartButton count={cart?.totalQuantity ?? 0} />;
}

function CartButton({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <button aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`} className="icon-button cart-button" onClick={() => {
      open('cart');
      publish('cart_viewed', {cart, prevCart, shop, url: window.location.href || ''} as CartViewPayload);
    }}>
      <BagIcon />
      {count > 0 ? <span className="cart-badge" aria-hidden>{count}</span> : null}
    </button>
  );
}

function MenuIcon() { return <svg aria-hidden viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>; }
function SearchIcon() { return <svg aria-hidden viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>; }
function AccountIcon() { return <svg aria-hidden viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4" /><path d="M4 22c0-5 3.6-8 8-8s8 3 8 8" /></svg>; }
function BagIcon() { return <svg aria-hidden viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>; }
function ChevronIcon({direction}: {direction: 'up' | 'down'}) { return <svg aria-hidden className={direction === 'up' ? 'rotate-180' : ''} viewBox="0 0 16 16"><path d="m3 6 5 5 5-5" /></svg>; }

const fallbackMenu = [
  {id: 'new', title: 'New Arrivals', url: '/collections/new-arrivals', items: []},
  {id: 'luxury', title: 'Luxury Pret', url: '/collections/luxury-pret', items: []},
  {id: 'casual', title: 'Casual Wear', url: '/collections/casual-wear', items: []},
  {id: 'formal', title: 'Formal Wear', url: '/collections/formal-wear', items: []},
  {id: 'wedding', title: 'Wedding Collection', url: '/collections/wedding-collection', items: []},
  {id: 'festive', title: 'Festive Collection', url: '/collections/festive-collection', items: []},
  {id: 'sale', title: 'Sale', url: '/collections/sale', items: []},
];
