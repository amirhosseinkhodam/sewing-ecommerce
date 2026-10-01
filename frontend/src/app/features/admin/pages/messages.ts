import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { ContactMessageModel } from '@domain/models/contact';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import Delete01Icon from '@hugeicons/core-free-icons/Delete01Icon';
import MailOpen01Icon from '@hugeicons/core-free-icons/MailOpen01Icon';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { EmptyStateComponent } from '@shared/components/empty-state';
import { SelectComponent } from '@shared/components/select';
import { SkeletonComponent } from '@shared/components/skeleton';
import type { SelectOption } from '@shared/models/select';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { ModalService } from '@shared/services/modal';
import { AdminMessageStore } from '../store/message';

const READ_FILTERS = {
  all: 'all',
  unread: 'unread',
  read: 'read',
} as const;

@Component({
  selector: 'app-admin-messages',
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    HugeiconsIconComponent,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    SelectComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  providers: [AdminMessageStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ 'messages' | translate }}
          </h1>
          @if (store.unreadCount() > 0) {
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {{ store.unreadCount() | localizedNumber }}
              {{ 'unreadMessages' | translate }}
            </p>
          }
        </div>
        <div class="w-full sm:w-48">
          <app-select
            [options]="readOptions()"
            [value]="currentFilter()"
            (selectChange)="onFilterChange($event)"
          />
        </div>
      </div>

      @if (store.loading()) {
        <div class="flex flex-col gap-4" role="status" aria-live="polite">
          <span class="sr-only">{{ 'loading' | translate }}</span>
          @for (row of [1, 2, 3, 4]; track row) {
            <app-card variant="bordered">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex flex-col gap-2">
                  <app-skeleton cssClass="h-4 w-32" />
                  <app-skeleton cssClass="h-3 w-48" />
                  <app-skeleton cssClass="h-3 w-24" />
                </div>
              </div>
              <div
                class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                <app-skeleton cssClass="h-4 w-full" />
                <app-skeleton cssClass="mt-2 h-4 w-2/3" />
              </div>
            </app-card>
          }
        </div>
      } @else if (store.error()) {
        <app-empty-state
          titleKey="couldNotLoadData"
          actionLabelKey="refresh"
          (actionClick)="store.reload()"
        />
      } @else if (store.messages().length === 0) {
        <app-empty-state titleKey="noMessages" />
      } @else {
        <div class="flex flex-col gap-4">
          @for (message of store.messages(); track message.id) {
            <app-card
              variant="bordered"
              [cssClass]="
                message.isRead
                  ? ''
                  : 'border-s-4 !border-s-blue-600 dark:!border-s-blue-500'
              "
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p
                    class="font-medium text-slate-900 dark:text-slate-100 truncate"
                  >
                    {{ message.name }}
                    @if (!message.isRead) {
                      <span
                        class="ms-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400"
                      >
                        {{ 'unread' | translate }}
                      </span>
                    }
                  </p>
                  <p
                    class="text-sm text-slate-500 dark:text-slate-400 mt-1"
                    dir="ltr"
                  >
                    {{ message.email }}
                    @if (message.phone; as phone) {
                      · {{ phone }}
                    }
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ message.createdAt | localizedDate }}
                  </p>
                </div>
                <div class="flex shrink-0 gap-2">
                  @if (!message.isRead) {
                    <app-button
                      variant="ghost"
                      [ariaLabel]="'markAsRead' | translate"
                      (buttonClick)="onMarkRead(message)"
                    >
                      <hugeicons-icon
                        [icon]="icons.MailOpen01Icon"
                        [size]="18"
                        color="currentColor"
                        [strokeWidth]="1.5"
                      />
                    </app-button>
                  }
                  <app-button
                    variant="ghost"
                    ariaLabel="Delete"
                    cssClass="!text-red-600 dark:!text-red-400"
                    (buttonClick)="onDelete(message)"
                  >
                    <hugeicons-icon
                      [icon]="icons.Delete01Icon"
                      [size]="18"
                      color="currentColor"
                      [strokeWidth]="1.5"
                    />
                  </app-button>
                </div>
              </div>

              <p
                class="text-sm text-slate-700 dark:text-slate-200 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 whitespace-pre-line"
              >
                {{ message.message }}
              </p>
            </app-card>
          }
        </div>

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
export class AdminMessagesComponent {
  readonly store = inject(AdminMessageStore);

  readonly icons = { MailOpen01Icon, Delete01Icon };

  readonly #modal = inject(ModalService);
  readonly #language = inject(LanguageService);

  readonly readOptions = (): SelectOption[] => [
    { value: READ_FILTERS.all, label: this.#language.translate('allMessages') },
    { value: READ_FILTERS.unread, label: this.#language.translate('unread') },
    { value: READ_FILTERS.read, label: this.#language.translate('read') },
  ];

  currentFilter(): string {
    const isRead = this.store.isRead();
    if (isRead === null) return READ_FILTERS.all;
    return isRead ? READ_FILTERS.read : READ_FILTERS.unread;
  }

  onFilterChange(value: string | number | null) {
    if (value === READ_FILTERS.unread) {
      this.store.setIsRead(false);
      return;
    }
    if (value === READ_FILTERS.read) {
      this.store.setIsRead(true);
      return;
    }
    this.store.setIsRead(null);
  }

  onMarkRead(message: ContactMessageModel) {
    this.store.markRead(message.id);
  }

  onDelete(message: ContactMessageModel) {
    void this.#modal
      .open({
        title: 'confirmDeleteTitle',
        description: 'confirmDeleteMessage',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .then((confirmed) => {
        if (confirmed) this.store.removeMessage(message.id);
      });
  }

  onPageChange(page: number) {
    this.store.setPage(page);
  }
}
