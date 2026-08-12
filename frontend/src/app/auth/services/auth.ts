import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UserModel } from '@domain/models/user';
import {
  AuthPayloadModel,
  AuthResponseModel,
  RegisterPayloadModel,
} from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api/auth';

  login(payload: AuthPayloadModel): Observable<AuthResponseModel> {
    return this.#http.post<AuthResponseModel>(
      `${this.#baseUrl}/login`,
      payload,
    );
  }

  register(payload: RegisterPayloadModel): Observable<AuthResponseModel> {
    return this.#http.post<AuthResponseModel>(
      `${this.#baseUrl}/register`,
      payload,
    );
  }

  refresh(token: string): Observable<AuthResponseModel> {
    return this.#http.post<AuthResponseModel>(`${this.#baseUrl}/refresh`, {
      refreshToken: token,
    });
  }

  me(): Observable<UserModel> {
    return this.#http.get<UserModel>(`${this.#baseUrl}/me`);
  }

  updateProfile(payload: Partial<UserModel>): Observable<UserModel> {
    return this.#http.patch<UserModel>(`${this.#baseUrl}/profile`, payload);
  }
}
