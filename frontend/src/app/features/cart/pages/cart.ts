import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Image01Icon,
  MinusSignIcon,
  Add01Icon,
} from '@hugeicons/core-free-icons';
import type { CartItemModel } from '@domain/models/cart';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { ModalService } from '@shared/services/modal';
import { NotificationService } from '@shared/services/notification';
import { CartStore } from '../store/cart';

@Component({
  selector: 'app-cart',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        {{ 'cart' | translate }}
      </h1>

      @if (store.loading() && store.items().length === 0) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.items().length === 0) {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'cartEmpty' | translate }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ 'cartEmptyMessage' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onStartShopping()">
            {{ 'startShopping' | translate }}
          </app-button>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 flex flex-col gap-4">
            @for (item of store.items(); track item.id) {
              <div
                class="flex items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
              >
                @if (item.productImage; as image) {
                  <img
                    [src]="image"
                    [alt]="item.productName"
                    class="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                  />
                } @else {
                  <div
                    class="flex w-20 h-20 rounded-lg items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                  >
                    <hugeicons-icon
                      [icon]="icons.Image01Icon"
                      [size]="28"
                      color="currentColor"
                      [strokeWidth]="1.5"
                    />
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium text-slate-900 dark:text-slate-100 truncate"
                  >
                    {{ item.productName }}
                  </p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {{ 'size' | translate }}: {{ item.size }}
                  </p>
                  <div class="flex items-center gap-3 mt-3">
                    <div
                      class="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        class="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
                        [disabled]="item.quantity <= 1 || store.loading()"
                        (click)="onDecrease(item)"
                        [attr.aria-label]="'decreaseQuantity' | translate"
                      >
                        <hugeicons-icon
                          [icon]="icons.MinusSignIcon"
                          [size]="16"
                          color="currentColor"
                          [strokeWidth]="1.5"
                        />
                      </button>
                      <span
                        class="w-10 text-center text-sm font-medium text-slate-900 dark:text-slate-100"
                      >
                        {{ item.quantity }}
                      </span>
                      <button
                        type="button"
                        class="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
                        [disabled]="
                          item.quantity >= item.stock || store.loading()
                        "
                        (click)="onIncrease(item)"
                        [attr.aria-label]="'increaseQuantity' | translate"
                      >
                        <hugeicons-icon
                          [icon]="icons.Add01Icon"
                          [size]="16"
                          color="currentColor"
                          [strokeWidth]="1.5"
                        />
                      </button>
                    </div>
                    <button
                      type="button"
                      class="text-sm text-red-600 dark:text-red-400 hover:underline"
                      (click)="onRemove(item)"
                    >
                      {{ 'remove' | translate }}
                    </button>
                  </div>
                </div>
                <div class="text-end shrink-0">
                  <p class="font-bold text-slate-900 dark:text-slate-100">
                    {{
                      item.quantity * toNumber(item.unitPrice) | localizedNumber
                    }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ 'currencyToman' | translate }}
                  </p>
                </div>
              </div>
            }
          </div>

          <app-card variant="bordered" cssClass="h-fit lg:sticky lg:top-24">
            <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
              {{ 'orderSummary' | translate }}
            </h2>
            <div
              class="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              <span>{{ 'subtotal' | translate }}</span>
              <span>
                {{ store.totalPrice() | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
            </div>
            <div
              class="flex justify-between font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3"
            >
              <span>{{ 'grandTotal' | translate }}</span>
              <span>
                {{ store.totalPrice() | localizedNumber }}
                {{ 'currencyToman' | translate }}
              </span>
            </div>
            <app-button
              variant="primary"
              size="lg"
              cssClass="mt-6 w-full"
              (buttonClick)="onCheckout()"
            >
              {{ 'proceedToCheckout' | translate }}
            </app-button>
          </app-card>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  readonly store = inject(CartStore);

  readonly icons = { Image01Icon, MinusSignIcon, Add01Icon };

  readonly #router = inject(Router);
  readonly #modal = inject(ModalService);
  readonly #notification = inject(NotificationService);
  readonly #language = inject(LanguageService);

  toNumber(value: string | number): number {
    return Number(value);
  }

  onStartShopping() {
    this.#router.navigate(['/products']);
  }

  onIncrease(item: CartItemModel) {
    if (item.quantity >= item.stock) return;
    this.store.updateQuantity({ itemId: item.id, quantity: item.quantity + 1 });
  }

  onDecrease(item: CartItemModel) {
    if (item.quantity <= 1) return;
    this.store.updateQuantity({ itemId: item.id, quantity: item.quantity - 1 });
  }

  onRemove(item: CartItemModel) {
    this.#modal
      .open({
        title: 'removeFromCart',
        description: 'confirmRemoveFromCart',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.store.removeItem(item.id);
        this.#notification.show(
          'success',
          this.#language.translate('itemRemoved'),
        );
      });
  }

  onCheckout() {
    this.#router.navigate(['/checkout']);
  }
}
