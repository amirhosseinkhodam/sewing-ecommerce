import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth';

// Each route's `data` carries `titleKey`/`descriptionKey`/`noindex` (see
// `PageSeoModel` in shared/services/seo.ts), read by `AppComponent`'s
// `NavigationEnd` handler. Router's `Data` type is a plain index signature,
// so no augmentation is needed to attach these — the keys are read back with
// a cast at the one call site instead.

export const routes: Routes = [
  {
    path: '',
    data: { titleKey: 'home', descriptionKey: 'seo.home' },
    loadComponent: () =>
      import('./features/home/pages/home').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    data: { titleKey: 'products', descriptionKey: 'seo.products' },
    loadComponent: () =>
      import('./features/products/pages/catalog').then(
        (m) => m.CatalogComponent,
      ),
  },
  {
    path: 'products/:slug',
    data: { titleKey: 'products', descriptionKey: 'seo.productDetail' },
    loadComponent: () =>
      import('./features/products/pages/product-detail').then(
        (m) => m.ProductDetailComponent,
      ),
  },
  {
    path: 'portfolio',
    data: { titleKey: 'portfolio', descriptionKey: 'seo.portfolio' },
    loadComponent: () =>
      import('./features/portfolio/pages/portfolio').then(
        (m) => m.PortfolioComponent,
      ),
  },
  {
    path: 'portfolio/:slug',
    data: { titleKey: 'portfolio', descriptionKey: 'seo.portfolioDetail' },
    loadComponent: () =>
      import('./features/portfolio/pages/portfolio-detail').then(
        (m) => m.PortfolioDetailComponent,
      ),
  },
  {
    path: 'about',
    data: { titleKey: 'about', descriptionKey: 'seo.about' },
    loadComponent: () =>
      import('./features/contact/pages/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    data: { titleKey: 'contact', descriptionKey: 'seo.contact' },
    loadComponent: () =>
      import('./features/contact/pages/contact').then(
        (m) => m.ContactComponent,
      ),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    data: { titleKey: 'cart', descriptionKey: 'seo.cart' },
    loadComponent: () =>
      import('./features/cart/pages/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    data: { titleKey: 'checkout', descriptionKey: 'seo.checkout' },
    loadComponent: () =>
      import('./features/orders/pages/checkout').then(
        (m) => m.CheckoutComponent,
      ),
  },
  {
    path: 'addresses',
    canActivate: [authGuard],
    data: { titleKey: 'myAddresses', descriptionKey: 'seo.addresses' },
    loadComponent: () =>
      import('./features/addresses/pages/addresses').then(
        (m) => m.AddressesComponent,
      ),
  },
  {
    path: 'login',
    data: { titleKey: 'login', descriptionKey: 'seo.login' },
    loadComponent: () =>
      import('./auth/pages/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    data: { titleKey: 'register', descriptionKey: 'seo.register' },
    loadComponent: () =>
      import('./auth/pages/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    data: { titleKey: 'orders', descriptionKey: 'seo.orders' },
    loadComponent: () =>
      import('./features/orders/pages/order-history').then(
        (m) => m.OrderHistoryComponent,
      ),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    data: { titleKey: 'orderDetail', descriptionKey: 'seo.orderDetail' },
    loadComponent: () =>
      import('./features/orders/pages/order-detail').then(
        (m) => m.OrderDetailComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    data: { titleKey: 'profile', descriptionKey: 'seo.profile' },
    loadComponent: () =>
      import('./auth/pages/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    // Set once here; nothing a shop's customers or search engines need indexed.
    // The NavigationEnd handler merges data down the route chain, so every
    // admin child inherits `noindex` without repeating it.
    data: { noindex: true },
    loadComponent: () =>
      import('./features/admin/components/admin-layout').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        data: { titleKey: 'dashboard', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/dashboard').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'products',
        data: { titleKey: 'manageProducts', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/products').then(
            (m) => m.AdminProductsComponent,
          ),
      },
      {
        path: 'products/new',
        data: { titleKey: 'manageProducts', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/product-form').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        data: { titleKey: 'manageProducts', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/product-form').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'categories',
        data: { titleKey: 'manageCategories', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/categories').then(
            (m) => m.AdminCategoriesComponent,
          ),
      },
      {
        path: 'orders',
        data: { titleKey: 'manageOrders', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/orders').then(
            (m) => m.AdminOrdersComponent,
          ),
      },
      {
        path: 'orders/:id',
        data: { titleKey: 'orderDetail', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/order-detail').then(
            (m) => m.AdminOrderDetailComponent,
          ),
      },
      {
        path: 'portfolio',
        data: { titleKey: 'managePortfolio', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/portfolio').then(
            (m) => m.AdminPortfolioComponent,
          ),
      },
      {
        path: 'portfolio/new',
        data: { titleKey: 'managePortfolio', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/portfolio-form').then(
            (m) => m.AdminPortfolioFormComponent,
          ),
      },
      {
        path: 'portfolio/:id/edit',
        data: { titleKey: 'managePortfolio', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/portfolio-form').then(
            (m) => m.AdminPortfolioFormComponent,
          ),
      },
      {
        path: 'messages',
        data: { titleKey: 'messages', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/messages').then(
            (m) => m.AdminMessagesComponent,
          ),
      },
      {
        path: 'customers',
        data: { titleKey: 'manageCustomers', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/customers').then(
            (m) => m.AdminCustomersComponent,
          ),
      },
      {
        path: 'settings',
        data: { titleKey: 'settings', descriptionKey: 'seo.admin' },
        loadComponent: () =>
          import('./features/admin/pages/settings').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    data: {
      titleKey: 'pageNotFound',
      descriptionKey: 'seo.notFound',
      noindex: true,
    },
    loadComponent: () =>
      import('./features/errors/pages/not-found').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
