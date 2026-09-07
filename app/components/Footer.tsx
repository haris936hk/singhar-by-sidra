import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {normalizeMenuUrl} from '~/lib/menu';
import {siteConfig} from '~/lib/site-config';

interface FooterProps {
  cartPage?: boolean;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
  currentYear: number;
}

type FooterItem = {
  id: string;
  title: string;
  url?: string | null;
  items?: FooterItem[];
};

export function Footer({
  cartPage,
  footer,
  header,
  publicStoreDomain,
  currentYear,
}: FooterProps) {
  return (
    <footer className={`site-footer${cartPage ? ' site-footer-cart' : ''}`}>
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span lang="ur">{siteConfig.brand.urdu}</span>
            <strong>{siteConfig.brand.english}</strong>
            <p>{siteConfig.brand.statement}</p>
          </div>
          <Suspense
            fallback={
              <FooterMenu
                menu={null}
                domains={[publicStoreDomain, header.shop.primaryDomain.url]}
              />
            }
          >
            <Await resolve={footer}>
              {(resolved) => (
                <FooterMenu
                  menu={resolved?.menu ?? null}
                  domains={[publicStoreDomain, header.shop.primaryDomain.url]}
                />
              )}
            </Await>
          </Suspense>
          <SocialLinks />
        </div>
        <div className="footer-trust" aria-label="Shopping assurances">
          {siteConfig.trustStatements.map((statement) => (
            <div key={statement}>
              <span aria-hidden>✓</span>
              <p>{statement}</p>
            </div>
          ))}
        </div>
        <p className="footer-copyright">
          © {currentYear} Singhar by Sidra. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterMenu({
  menu,
  domains,
}: {
  menu: FooterQuery['menu'];
  domains: string[];
}) {
  const hasNestedColumns = menu?.items.some((item) => item.items.length);
  const items = (hasNestedColumns
    ? menu?.items
    : fallbackFooter) as unknown as FooterItem[];
  return (
    <nav aria-label="Footer navigation" className="footer-menu">
      {items.map((group) => {
        const children = group.items?.length ? group.items : [group];
        return (
          <div key={group.id}>
            <h2>{group.items?.length ? group.title : 'Customer Care'}</h2>
            {children.map((item) => (
              <FooterLink domains={domains} item={item} key={item.id} />
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function FooterLink({item, domains}: {item: FooterItem; domains: string[]}) {
  if (!item.url) return null;
  const normalized = normalizeMenuUrl(item.url, domains);
  return normalized.external ? (
    <a href={normalized.url} rel="noopener noreferrer" target="_blank">
      {item.title}
    </a>
  ) : (
    <Link prefetch="intent" to={normalized.url}>
      {item.title}
    </Link>
  );
}

function SocialLinks() {
  const links = [
    ['Instagram', siteConfig.marketing.instagramUrl],
    ['Facebook', siteConfig.marketing.facebookUrl],
    ['Pinterest', siteConfig.marketing.pinterestUrl],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (!links.length) return null;
  return (
    <div className="footer-social">
      <h2>Connect</h2>
      <div>
        {links.map(([label, url]) => (
          <a
            aria-label={label}
            href={url}
            key={label}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label.slice(0, 2).toUpperCase()}
          </a>
        ))}
      </div>
    </div>
  );
}

const fallbackFooter = [
  {
    id: 'shop',
    title: 'Shop',
    items: [
      {
        id: 'new',
        title: 'New Arrivals',
        url: '/collections/new-arrivals',
        items: [],
      },
      {
        id: 'luxury',
        title: 'Luxury Pret',
        url: '/collections/luxury-pret',
        items: [],
      },
      {
        id: 'wedding',
        title: 'Wedding Collection',
        url: '/collections/wedding-collection',
        items: [],
      },
      {
        id: 'festive',
        title: 'Festive Collection',
        url: '/collections/festive-collection',
        items: [],
      },
      {id: 'sale', title: 'Sale', url: '/collections/sale', items: []},
    ],
  },
  {
    id: 'care',
    title: 'Customer Care',
    items: [
      {id: 'contact', title: 'Contact Us', url: '/pages/contact', items: []},
      {
        id: 'refund',
        title: 'Returns & Exchanges',
        url: '/policies/refund-policy',
        items: [],
      },
      {
        id: 'shipping',
        title: 'Shipping Policy',
        url: '/policies/shipping-policy',
        items: [],
      },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    items: [
      {id: 'about', title: 'Our Story', url: '/pages/about', items: []},
      {
        id: 'privacy',
        title: 'Privacy Policy',
        url: '/policies/privacy-policy',
        items: [],
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        url: '/policies/terms-of-service',
        items: [],
      },
    ],
  },
];
