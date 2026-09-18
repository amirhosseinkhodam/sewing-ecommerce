import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  PlusSignIcon,
  Edit01Icon,
  Delete01Icon,
  Image01Icon,
} from '@hugeicons/core-free-icons';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { ModalService } from '@shared/services/modal';
import type { ProductModel } from '../../products/models/product';
import { AdminProductStore } from '../store/product';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    HugeiconsIconComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  providers: [AdminProductStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'manageProducts' | translate }}
        </h1>
        <app-button variant="primary" (buttonClick)="onNew()">
          <hugeicons-icon
            [icon]="icons.PlusSignIcon"
            [size]="18"
            color="currentColor"
            [strokeWidth]="2"
          />
          {{ 'newProduct' | translate }}
        </app-button>
      </div>

      <app-input
        [placeholder]="'search' | translate"
        (inputChange)="onSearchInput($event)"
        (inputBlur)="onSearchApply()"
        (inputKeydown)="onSearchKeydown($event)"
      />

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
                    {{ 'productName' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'category' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'price' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'isActive' | translate }}
                  </th>
                  <th class="px-4 py-3 text-end font-medium">
                    {{ 'actions' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (product of store.products(); track product.id) {
                  <tr
                    class="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="h-10 w-10 shrink-0 overflow-hidden rounded-control bg-slate-100 dark:bg-slate-800"
                        >
                          @if (product.images[0]; as image) {
                            <img
                              [src]="image"
                              [alt]="product.name"
                              class="h-full w-full object-cover"
                            />
                          } @else {
                            <div
                              class="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500"
                            >
                              <hugeicons-icon
                                [icon]="icons.Image01Icon"
                                [size]="16"
                                color="currentColor"
                                [strokeWidth]="1.5"
                              />
                            </div>
                          }
                        </div>
                        <span
                          class="font-medium text-slate-900 dark:text-slate-100"
                        >
                          {{ product.name }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {{ product.category?.name }}
                    </td>
                    <td class="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {{ product.price | localizedNumber }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        [class]="
                          product.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        "
                      >
                        {{
                          product.isActive
                            ? ('yes' | translate)
                            : ('no' | translate)
                        }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        <app-button
                          variant="ghost"
                          ariaLabel="Edit"
                          (buttonClick)="onEdit(product)"
                        >
                          <hugeicons-icon
                            [icon]="icons.Edit01Icon"
                            [size]="18"
                            color="currentColor"
                            [strokeWidth]="1.5"
                          />
                        </app-button>
                        <app-button
                          variant="ghost"
                          ariaLabel="Delete"
                          cssClass="!text-red-600 dark:!text-red-400"
                          (buttonClick)="onDelete(product)"
                        >
                          <hugeicons-icon
                            [icon]="icons.Delete01Icon"
                            [size]="18"
                            color="currentColor"
                            [strokeWidth]="1.5"
                          />
                        </app-button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="5"
                      class="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      {{ 'noProductsFound' | translate }}
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
              [disabled]="store.query().page! <= 1"
              (buttonClick)="onPageChange(store.query().page! - 1)"
            >
              {{ 'previous' | translate }}
            </app-button>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{
                'pageOf'
                  | translate
                    : {
                        page: store.query().page!,
                        totalPages: store.totalPages(),
                      }
              }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.query().page! >= store.totalPages()"
              (buttonClick)="onPageChange(store.query().page! + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  readonly store = inject(AdminProductStore);

  readonly icons = { PlusSignIcon, Edit01Icon, Delete01Icon, Image01Icon };

  readonly #router = inject(Router);
  readonly #modal = inject(ModalService);
  #searchInput = '';

  ngOnInit() {
    this.store.loadProducts();
  }

  onNew() {
    this.#router.navigate(['/admin/products/new']);
  }

  onEdit(product: ProductModel) {
    this.#router.navigate(['/admin/products', product.id, 'edit']);
  }

  onDelete(product: ProductModel) {
    this.#modal
      .open({
        title: 'confirmDeleteTitle',
        description: 'confirmDeleteProduct',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .subscribe((confirmed) => {
        if (confirmed) this.store.removeProduct(product.id);
      });
  }

  onSearchInput(value: string) {
    this.#searchInput = value;
  }

  onSearchApply() {
    this.store.patchQuery({ search: this.#searchInput.trim() || undefined });
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearchApply();
    }
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
