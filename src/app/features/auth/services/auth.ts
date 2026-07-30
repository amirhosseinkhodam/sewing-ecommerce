import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  AuthPayloadModel,
  AuthResponseModel,
  AuthUserModel,
  RegisterPayloadModel,
} from "../models/auth";

@Injectable({ providedIn: "root" })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = "/api/auth";

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

  me(): Observable<AuthUserModel> {
    return this.#http.get<AuthUserModel>(`${this.#baseUrl}/me`);
  }

  updateProfile(payload: Partial<AuthUserModel>): Observable<AuthUserModel> {
    return this.#http.patch<AuthUserModel>(`${this.#baseUrl}/profile`, payload);
  }
}
