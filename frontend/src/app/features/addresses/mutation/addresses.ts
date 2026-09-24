import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { AddressModel, AddressPayloadModel } from '@domain/models/address';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { AddressService } from '../services/address';

export interface SaveAddressModel {
  readonly id?: string;
  readonly payload: AddressPayloadModel;
}

/** Creates or updates, depending on whether an id is supplied. */
export function injectSaveAddressMutation(options?: {
  readonly notify?: boolean;
  readonly onSuccess?: (address: AddressModel) => void;
}) {
  const addressService = inject(AddressService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();
  const notify = options?.notify ?? true;

  return injectMutation(() => ({
    mutationFn: ({ id, payload }: SaveAddressModel) =>
      firstValueFrom(
        id
          ? addressService.update(id, payload)
          : addressService.create(payload),
      ),
    onSuccess: async (address) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.addresses],
      });
      if (notify) feedback.success('addressSaved');
      options?.onSuccess?.(address);
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemoveAddressMutation() {
  const addressService = inject(AddressService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(addressService.remove(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.addresses],
      });
      feedback.success('addressDeleted');
    },
    onError: (error) => feedback.error(error, 'couldNotDelete'),
  }));
}

/** Promoting one address demotes the rest, so the whole list is refetched. */
export function injectSetDefaultAddressMutation() {
  const addressService = inject(AddressService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) =>
      firstValueFrom(addressService.update(id, { isDefault: true })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.addresses] }),
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
