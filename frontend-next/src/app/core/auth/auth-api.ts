import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { UserModel } from '@domain/models/user';
import type { AuthTokens, LoginPayload, RegisterPayload, UpdateProfilePayload } from './auth.model';

const BASE = '/api/auth';

/** Typed access to `/api/auth/*`. Holds no state. */
@Service()
export class AuthApi {
  readonly #http = inject(HttpClient);

  login(payload: LoginPayload) {
    return this.#http.post<AuthTokens>(`${BASE}/login`, payload);
  }

  register(payload: RegisterPayload) {
    return this.#http.post<AuthTokens>(`${BASE}/register`, payload);
  }

  refresh(refreshToken: string) {
    return this.#http.post<AuthTokens>(`${BASE}/refresh`, { refreshToken });
  }

  me() {
    return this.#http.get<UserModel>(`${BASE}/me`);
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.#http.patch<UserModel>(`${BASE}/profile`, payload);
  }
}
