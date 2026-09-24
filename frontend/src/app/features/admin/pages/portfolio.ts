import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Delete01Icon,
  Edit01Icon,
  Image01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import type { PortfolioModel } from '@domain/models/portfolio';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { ModalService } from '@shared/services/modal';
import { AdminPortfolioStore } from '../store/portfolio';

@Component({
  selector: 'app-admin-portfolio',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    InputComponent,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  providers: [AdminPortfolioStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'managePortfolio' | translate }}
        </h1>
        <app-button variant="primary" (buttonClick)="onNew()">
          <hugeicons-icon
            [icon]="icons.PlusSignIcon"
            [size]="18"
            color="currentColor"
            [strokeWidth]="2"
          />
          {{ 'newPortfolioItem' | translate }}
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
                  class="border-b border-slate-200 dark:border-slate-700 text-start text-slate-500 dark:text-slate-400"
                >
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'image' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'title' | translate }}
                  </th>
                  <th class="px-4 py-3 text-start font-medium">
                    {{ 'category' | translate }}
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
                @for (item of store.items(); track item.id) {
                  <tr
                    class="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <td class="px-4 py-3">
                      @if (item.images[0]; as image) {
                        <img
                          [src]="image"
                          [alt]="item.title"
                          class="h-12 w-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                        />
                      } @else {
                        <div
                          class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                        >
                          <hugeicons-icon
                            [icon]="icons.Image01Icon"
                            [size]="18"
                            color="currentColor"
                            [strokeWidth]="1.5"
                          />
                        </div>
                      }
                    </td>
                    <td
                      class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100"
                    >
                      {{ item.title }}
                      <span
                        class="block font-mono text-xs text-slate-500 dark:text-slate-400"
                      >
                        {{ item.slug }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {{ item.category?.name ?? '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        [class]="
                          item.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        "
                      >
                        {{
                          item.isActive
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
                          (buttonClick)="onEdit(item)"
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
                          (buttonClick)="onDelete(item)"
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
                      {{ 'noPortfolioItems' | translate }}
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
export class AdminPortfolioComponent {
  readonly store = inject(AdminPortfolioStore);

  readonly icons = {
    PlusSignIcon,
    Edit01Icon,
    Delete01Icon,
    Image01Icon,
  };

  readonly #router = inject(Router);
  readonly #modal = inject(ModalService);
  #searchInput = '';

  onNew() {
    this.#router.navigate(['/admin/portfolio/new']);
  }

  onEdit(item: PortfolioModel) {
    this.#router.navigate(['/admin/portfolio', item.id, 'edit']);
  }

  onDelete(item: PortfolioModel) {
    this.#modal
      .open({
        title: 'confirmDeleteTitle',
        description: 'confirmDeletePortfolio',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .then((confirmed) => {
        if (confirmed) this.store.removeItem(item.id);
      });
  }

  onSearchInput(value: string) {
    this.#searchInput = value;
  }

  onSearchApply() {
    this.store.setSearch(this.#searchInput);
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.onSearchApply();
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
