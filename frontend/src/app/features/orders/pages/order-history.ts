import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Image01Icon } from '@hugeicons/core-free-icons';
import type { OrderModel } from '@domain/models/order';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { OrderStatusBadgeComponent } from '../components/order-status-badge';
import { OrderStore } from '../store/order';

@Component({
  selector: 'app-order-history',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    LoadingSpinnerComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    OrderStatusBadgeComponent,
    TranslatePipe,
  ],
  providers: [OrderStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        {{ 'orderHistory' | translate }}
      </h1>

      @if (store.loading() && store.orders().length === 0) {
        <div class="flex justify-center py-20">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else if (store.orders().length === 0) {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'noOrders' | translate }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ 'noOrdersMessage' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onStartShopping()">
            {{ 'startShopping' | translate }}
          </app-button>
        </div>
      } @else {
        <div class="flex flex-col gap-4">
          @for (order of store.orders(); track order.id) {
            <app-card variant="bordered">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ 'orderNumber' | translate }}
                  </p>
                  <p
                    class="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 truncate"
                  >
                    {{ shortId(order.id) }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ order.createdAt | localizedDate }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <app-order-status-badge [status]="order.status" />
                  <app-order-status-badge
                    [paymentStatus]="order.paymentStatus"
                  />
                </div>
              </div>

              <div
                class="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                @for (item of previewItems(order); track item.id) {
                  @if (item.productImage; as image) {
                    <img
                      [src]="image"
                      [alt]="item.productName"
                      class="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                    />
                  } @else {
                    <div
                      class="flex w-12 h-12 rounded-lg items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                    >
                      <hugeicons-icon
                        [icon]="icons.Image01Icon"
                        [size]="20"
                        color="currentColor"
                        [strokeWidth]="1.5"
                      />
                    </div>
                  }
                }
                @if (remainingCount(order); as remaining) {
                  <span class="text-sm text-slate-500 dark:text-slate-400">
                    +{{ remaining | localizedNumber }}
                  </span>
                }
              </div>

              <div
                class="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                <p class="font-bold text-slate-900 dark:text-slate-100">
                  {{ toNumber(order.totalAmount) | localizedNumber }}
                  {{ 'currencyToman' | translate }}
                </p>
                <app-button
                  variant="secondary"
                  (buttonClick)="onView(order.id)"
                >
                  {{ 'viewDetails' | translate }}
                </app-button>
              </div>
            </app-card>
          }
        </div>

        @if (store.totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-8">
            <app-button
              variant="secondary"
              [disabled]="store.page() <= 1"
              (buttonClick)="onPage(store.page() - 1)"
            >
              {{ 'back' | translate }}
            </app-button>
            <span class="text-sm text-slate-600 dark:text-slate-300">
              {{ store.page() | localizedNumber }} /
              {{ store.totalPages() | localizedNumber }}
            </span>
            <app-button
              variant="secondary"
              [disabled]="store.page() >= store.totalPages()"
              (buttonClick)="onPage(store.page() + 1)"
            >
              {{ 'next' | translate }}
            </app-button>
          </div>
        }
      }
    </div>
  `,
})
export class OrderHistoryComponent implements OnInit {
  readonly store = inject(OrderStore);

  readonly icons = { Image01Icon };

  readonly #router = inject(Router);

  ngOnInit() {
    this.store.loadOrders();
  }

  toNumber(value: string): number {
    return Number(value);
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  previewItems(order: OrderModel) {
    return order.items.slice(0, 4);
  }

  /** Returns 0 when nothing is hidden, so the template's @if skips the chip. */
  remainingCount(order: OrderModel): number {
    return Math.max(0, order.items.length - 4);
  }

  onStartShopping() {
    this.#router.navigate(['/products']);
  }

  onView(id: string) {
    this.#router.navigate(['/orders', id]);
  }

  onPage(page: number) {
    this.store.setPage(page);
  }
}
