import {
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { AppComponent } from './app/app';
import { routes } from './app/main.route';
import { authInterceptor } from './app/core/interceptors/auth';
import { ThemeService } from './app/shared/services/theme';
import { LanguageService } from './app/shared/services/language';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
    ),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      inject(LanguageService);
      inject(ThemeService);
    }),
  ],
}).catch((error) => console.error(error));
