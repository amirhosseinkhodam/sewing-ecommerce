import type { UserModel } from '@domain/models/user';

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface RegisterPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  /** Iranian mobile, `09XXXXXXXXX` — mirrors the backend RegisterDto regex. */
  readonly phone: string;
}

/** Shape returned by login, register and refresh alike (a fixed contract). */
export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserModel;
}

export interface UpdateProfilePayload {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly password?: string;
}
