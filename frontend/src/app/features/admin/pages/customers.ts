import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { USER_ROLES, type UserRole } from '@domain/const/user-roles';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import type { SelectOption } from '@shared/models/select';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { AdminCustomerStore } from '../store/customer';

const ROLE_FILTER_ALL = 'all';

@Component({
  selector: 'app-admin-customers',
  imports: [
    ButtonComponent,
    CardComponent,
    InputComponent,
    LoadingSpinnerComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    SelectComponent,
    TranslatePipe,
  ],
  providers: [AdminCustomerStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ 'manageCustomers' | translate }}
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ store.total() | localizedNumber }}
            {{ 'customers' | translate }}
          </p>
        </div>
      </div>

      <app-card variant="bordered">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_12rem]">
          <app-input
            type="search"
            [value]="store.search()"
            [label]="'search' | translate"
            [placeholder]="'searchCustomers' | translate"
            (inputChange)="onSearch($event)"
          />
          <app-select
            [options]="roleOptions()"
            [value]="currentRole()"
            [label]="'role' | translate"
            (selectChange)="onRoleChange($event)"
          />
        </div>
      </app-card>

      @if (store.loading()) {
        <div class="flex justify-center py-16">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else {
        <app-card variant="bordered" padding="none">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                >
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'name' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'email' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'phoneNumber' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'role' | translate }}
                  </th>
                  <th class="px-4 py-3 text-end font-medium">
                    {{ 'orders' | translate }}
                  </th>
                  <th class="px-4 py-3 text-end font-medium">
                    {{ 'totalSpent' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'registeredOn' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (customer of store.customers(); track customer.id) {
                  <tr
                    class="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <td
                      class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ customer.firstName }} {{ customer.lastName }}
                    </td>
                    <td
                      class="px-4 py-3 text-slate-500 dark:text-slate-400"
                      dir="ltr"
                    >
                      {{ customer.email }}
                    </td>
                    <td
                      class="px-4 py-3 text-slate-500 dark:text-slate-400"
                      dir="ltr"
                    >
                      {{ customer.phone }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        [class]="
                          customer.role === roles.ADMIN
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        "
                      >
                        {{
                          customer.role === roles.ADMIN
                            ? ('admin' | translate)
                            : ('customer' | translate)
                        }}
                      </span>
                    </td>
                    <td
                      class="px-4 py-3 text-end text-slate-700 dark:text-slate-200"
                    >
                      {{ customer.orderCount | localizedNumber }}
                    </td>
                    <td
                      class="px-4 py-3 text-end font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ customer.totalSpent | localizedNumber }}
                      <span
                        class="text-xs font-normal text-slate-500 dark:text-slate-400"
                      >
                        {{ 'currencyToman' | translate }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {{ customer.createdAt | localizedDate }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="7"
                      class="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      {{ 'noCustomers' | translate }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-card>

        @if (store.totalPages() > 1) {
          <div class="flex items-center justify-center gap-4">
            <app-button
              variant="secondary"
              [disabled]="store.page() <= 1"
              (buttonClick)="onPageChange(store.page() - 1)"
            >
              {{ 'previous' | translate }}
            </app-button>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ store.page() | localizedNumber }} /
              {{ store.totalPages() | localizedNumber }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.page() >= store.totalPages()"
              (buttonClick)="onPageChange(store.page() + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminCustomersComponent {
  readonly store = inject(AdminCustomerStore);

  readonly roles = USER_ROLES;

  readonly #language = inject(LanguageService);

  readonly roleOptions = (): SelectOption[] => [
    { value: ROLE_FILTER_ALL, label: this.#language.translate('allRoles') },
    {
      value: USER_ROLES.CUSTOMER,
      label: this.#language.translate('customer'),
    },
    { value: USER_ROLES.ADMIN, label: this.#language.translate('admin') },
  ];

  currentRole(): string {
    return this.store.role() ?? ROLE_FILTER_ALL;
  }

  onSearch(value: string) {
    this.store.setSearch(value);
  }

  onRoleChange(value: string | number | null) {
    const role =
      value === USER_ROLES.CUSTOMER || value === USER_ROLES.ADMIN
        ? (value as UserRole)
        : null;
    this.store.setRole(role);
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
