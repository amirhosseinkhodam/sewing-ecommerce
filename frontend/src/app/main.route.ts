import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

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
    ],
  },
  { path: '**', redirectTo: '' },
];
