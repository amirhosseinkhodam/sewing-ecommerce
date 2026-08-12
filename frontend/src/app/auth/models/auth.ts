import { UserRole } from '@shared/const/user-roles';

export interface AuthUserModel {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: UserRole;
}

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

export interface AuthResponseModel {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUserModel;
}
