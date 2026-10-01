import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import {
  type AdminCustomerQueryModel,
  AdminCustomerService,
} from '../services/admin-customer';

/** Admin customer list, with aggregate order count and spend per row. */
export function injectAdminCustomersQuery(
  params: () => AdminCustomerQueryModel,
) {
  const customerService = inject(AdminCustomerService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.adminCustomers, params()],
    queryFn: () => firstValueFrom(customerService.list(params())),
  }));
}
