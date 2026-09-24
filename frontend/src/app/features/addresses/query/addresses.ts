import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { AddressService } from '../services/address';

/** The signed-in user's addresses. Shared with checkout. */
export function injectAddressesQuery() {
  const addressService = inject(AddressService);
  return injectQuery(() => ({
    queryKey: [QUERY_KEYS.addresses],
    queryFn: () => firstValueFrom(addressService.list()),
  }));
}
