import type { UserRole } from '../const/user-roles';

export interface UserModel {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: UserRole;
}
