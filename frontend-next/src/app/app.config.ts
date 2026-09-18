import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { authInterceptor } from '@core/auth/auth-interceptor';
import { LanguageService } from '@core/i18n/language';
import { ThemeService } from '@core/theme';
import { AuthApi } from '@core/auth/auth-api';
import { AuthSessionStore } from '@core/auth/session';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Routed pages receive route params as signal `input()`s instead of
      // injecting ActivatedRoute.
      withComponentInputBinding(),
      withViewTransitions(),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
    ),
    provideAppInitializer(async () => {
      inject(LanguageService);
      inject(ThemeService);
      const session = inject(AuthSessionStore);
      if (!session.accessToken()) return;
      const api = inject(AuthApi);
      const queryClient = inject(QueryClient);
      try {
        const user = await queryClient.fetchQuery({
          queryKey: ['auth', 'me'],
          queryFn: () => api.me().toPromise().then(requireValue),
        });
        session.setUser(user);
      } catch {
        session.clear();
      }
    }),
  ],
};

function requireValue<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Empty response');
  return value;
}
