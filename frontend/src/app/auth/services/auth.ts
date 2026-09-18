import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { UserModel } from '@domain/models/user';
import type {
  AuthPayloadModel,
  AuthResponseModel,
  RegisterPayloadModel,
} from '../models/auth';

@Service()
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/auth';

  login(payload: AuthPayloadModel) {
    return this.#http.post<AuthResponseModel>(
      `${this.#baseUrl}/login`,
      payload,
    );
  }

  register(payload: RegisterPayloadModel) {
    return this.#http.post<AuthResponseModel>(
      `${this.#baseUrl}/register`,
      payload,
    );
  }

  refresh(token: string) {
    return this.#http.post<AuthResponseModel>(`${this.#baseUrl}/refresh`, {
      refreshToken: token,
    });
  }

  me() {
    return this.#http.get<UserModel>(`${this.#baseUrl}/me`);
  }

  updateProfile(payload: Partial<UserModel>) {
    return this.#http.patch<UserModel>(`${this.#baseUrl}/profile`, payload);
  }
}
