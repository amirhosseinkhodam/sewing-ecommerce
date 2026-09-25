import type { UserModel } from '@domain/models/user';

export interface AuthPayloadModel {
  readonly email: string;
  readonly password: string;
}

export interface RegisterPayloadModel {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
}

export interface UpdateProfilePayloadModel {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
}

export interface AuthResponseModel {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserModel;
}

export interface LoginRequestModel {
  readonly payload: AuthPayloadModel;
  readonly returnUrl?: string;
}
