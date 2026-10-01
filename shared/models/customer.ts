import type { UserRole } from '../const/user-roles';

/**
 * An admin-facing customer row. Carries aggregate order figures so the list
 * does not need a follow-up request per row to show spend.
 */
export interface CustomerModel {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: UserRole;
  readonly orderCount: number;
  readonly totalSpent: string;
  readonly createdAt: string;
}

export interface CustomerQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly role?: UserRole;
}

export interface PaginatedCustomersModel {
  readonly items: CustomerModel[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
