import { Service, inject } from '@angular/core';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthApi } from './auth-api';
import type { AuthTokens, LoginPayload, RegisterPayload, UpdateProfilePayload } from './auth.model';
import { AuthSessionStore } from './session';

@Service()
export class AuthMutations {
  readonly #api = inject(AuthApi);
  readonly #session = inject(AuthSessionStore);
  readonly #queryClient = inject(QueryClient);

  readonly login = injectMutation(() => ({
    mutationKey: ['auth', 'login'],
    mutationFn: (payload: LoginPayload) => this.#api.login(payload).toPromise().then(requireResult),
    onSuccess: (result: AuthTokens) => this.#remember(result),
  }));

  readonly register = injectMutation(() => ({
    mutationKey: ['auth', 'register'],
    mutationFn: (payload: RegisterPayload) =>
      this.#api.register(payload).toPromise().then(requireResult),
    onSuccess: (result: AuthTokens) => this.#remember(result),
  }));

  readonly updateProfile = injectMutation(() => ({
    mutationKey: ['auth', 'profile'],
    mutationFn: (payload: UpdateProfilePayload) =>
      this.#api.updateProfile(payload).toPromise().then(requireResult),
    onSuccess: (user) => {
      this.#session.setUser(user);
      void this.#queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  }));

  #remember(result: AuthTokens): void {
    this.#session.setTokens(result.accessToken, result.refreshToken);
    this.#session.setUser(result.user);
  }
}

function requireResult<T>(result: T | undefined): T {
  if (result === undefined) throw new Error('Empty auth response');
  return result;
}
