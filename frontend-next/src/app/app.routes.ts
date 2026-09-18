import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then((m) => m.Home) },
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/profile').then((m) => m.Profile),
  },
  { path: '**', redirectTo: '' },
];
