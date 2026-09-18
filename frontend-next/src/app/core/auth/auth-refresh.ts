import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, throwError } from 'rxjs';
import { AuthApi } from './auth-api';
import { AuthSessionStore } from './session';

@Service()
export class AuthRefresh {
  readonly #api = inject(AuthApi);
  readonly #session = inject(AuthSessionStore);
  readonly #router = inject(Router);
  #pending: { token: string; result: Observable<string> } | undefined;

  accessToken(): Observable<string> {
    const token = this.#session.refreshToken();
    if (!token) {
      this.invalidate(this.#session.accessToken());
      return throwError(() => new Error('Session expired'));
    }
    if (this.#pending?.token === token) return this.#pending.result;

    const result = this.#api.refresh(token).pipe(
      map((tokens) => {
        if (this.#session.refreshToken() !== token) {
          throw new Error('Session changed during refresh');
        }
        this.#session.setTokens(tokens.accessToken, tokens.refreshToken);
        this.#session.setUser(tokens.user);
        return tokens.accessToken;
      }),
      catchError((error: unknown) => {
        if (this.#session.refreshToken() === token) {
          this.invalidate(this.#session.accessToken());
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (this.#pending?.result === result) this.#pending = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.#pending = { token, result };
    return result;
  }

  invalidate(accessToken: string | null): void {
    if (!accessToken || this.#session.accessToken() !== accessToken) return;
    this.#session.clear();
    void this.#router.navigateByUrl('/');
  }
}
