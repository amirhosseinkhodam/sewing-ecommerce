import { computed, Injectable } from '@angular/core';
import {
  injectRemoveAddressMutation,
  injectSaveAddressMutation,
  injectSetDefaultAddressMutation,
  type SaveAddressModel,
} from '../mutation/addresses';
import { injectAddressesQuery } from '../query/addresses';

@Injectable()
export class AddressesStore {
  readonly #addressesQuery = injectAddressesQuery();
  readonly addresses = computed(() => this.#addressesQuery.data() ?? []);
  readonly loading = computed(() => this.#addressesQuery.isPending());

  readonly #saveMutation = injectSaveAddressMutation();
  readonly #removeMutation = injectRemoveAddressMutation();
  readonly #defaultMutation = injectSetDefaultAddressMutation();

  save(value: SaveAddressModel): void {
    this.#saveMutation.mutate(value);
  }

  remove(id: string): void {
    this.#removeMutation.mutate(id);
  }

  setDefault(id: string): void {
    this.#defaultMutation.mutate(id);
  }
}
