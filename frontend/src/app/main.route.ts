import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/pages/catalog').then(
        (m) => m.CatalogComponent,
      ),
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./features/products/pages/product-detail').then(
        (m) => m.ProductDetailComponent,
      ),
  },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./features/portfolio/pages/portfolio').then(
        (m) => m.PortfolioComponent,
      ),
  },
  {
    path: 'portfolio/:slug',
    loadComponent: () =>
      import('./features/portfolio/pages/portfolio-detail').then(
        (m) => m.PortfolioDetailComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/contact/pages/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/pages/contact').then(
        (m) => m.ContactComponent,
      ),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/pages/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/pages/checkout').then(
        (m) => m.CheckoutComponent,
      ),
  },
  {
    path: 'addresses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/addresses/pages/addresses').then(
        (m) => m.AddressesComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/pages/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/pages/order-history').then(
        (m) => m.OrderHistoryComponent,
      ),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/pages/order-detail').then(
        (m) => m.OrderDetailComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/pages/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/components/admin-layout').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/pages/products').then(
            (m) => m.AdminProductsComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/admin/pages/product-form').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/admin/pages/product-form').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/pages/categories').then(
            (m) => m.AdminCategoriesComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/pages/orders').then(
            (m) => m.AdminOrdersComponent,
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/admin/pages/order-detail').then(
            (m) => m.AdminOrderDetailComponent,
          ),
      },
      {
        path: 'portfolio',
        loadComponent: () =>
          import('./features/admin/pages/portfolio').then(
            (m) => m.AdminPortfolioComponent,
          ),
      },
      {
        path: 'portfolio/new',
        loadComponent: () =>
          import('./features/admin/pages/portfolio-form').then(
            (m) => m.AdminPortfolioFormComponent,
          ),
      },
      {
        path: 'portfolio/:id/edit',
        loadComponent: () =>
          import('./features/admin/pages/portfolio-form').then(
            (m) => m.AdminPortfolioFormComponent,
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/admin/pages/messages').then(
            (m) => m.AdminMessagesComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
