import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLocation,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();
  const location = useLocation();

  const pageTitle = getAccountPageTitle(location.pathname);

  return (
    <div className="account-shell">
      <nav aria-label="Breadcrumb" className="account-breadcrumbs">
        <NavLink to="/">Home</NavLink>
        <span aria-hidden="true">/</span>
        <NavLink to="/account/orders">My Account</NavLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{pageTitle}</span>
      </nav>
      <div className="account-shell-body">
        <AccountMenu />
        <div className="account-shell-content">
          {pageTitle !== 'Addresses' && pageTitle !== 'Wishlist' ? (
            <h1 className="account-shell-page-title">{pageTitle}</h1>
          ) : null}
          <Outlet context={{customer}} />
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <>
      <nav aria-label="Account" className="account-menu account-menu-desktop">
        <p>My Account</p>
        <AccountLinks />
      </nav>
      <details className="account-menu-mobile">
        <summary>Account menu</summary>
        <nav aria-label="Account" className="account-menu-mobile-list">
          <AccountLinks />
        </nav>
      </details>
    </>
  );
}

function AccountLinks() {
  return (
    <ul>
      <li>
        <NavLink to="/account/orders">Orders</NavLink>
      </li>
      <li>
        <NavLink to="/account/profile">My Details</NavLink>
      </li>
      <li>
        <NavLink to="/account/wishlist">Wishlist</NavLink>
      </li>
      <li>
        <NavLink to="/account/addresses">Addresses</NavLink>
      </li>
      <li>
        <Logout />
      </li>
    </ul>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button type="submit">Log Out</button>
    </Form>
  );
}

function getAccountPageTitle(pathname: string) {
  if (pathname.startsWith('/account/addresses')) return 'Addresses';
  if (pathname.startsWith('/account/profile')) return 'My Details';
  if (pathname.startsWith('/account/wishlist')) return 'Wishlist';
  if (pathname.startsWith('/account/orders')) return 'Orders';
  return 'My Account';
}
