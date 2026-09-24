import { computed, Injectable, signal } from '@angular/core';
import {
  injectMarkMessageReadMutation,
  injectRemoveMessageMutation,
} from '../mutation/admin-messages';
import { injectAdminMessagesQuery } from '../query/admin-orders';

@Injectable()
export class AdminMessageStore {
  readonly page = signal(1);
  readonly pageSize = signal(20);
  /** null = all, true = read only, false = unread only. */
  readonly isRead = signal<boolean | null>(null);

  readonly #messagesQuery = injectAdminMessagesQuery(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    isRead: this.isRead() ?? undefined,
  }));
  readonly messages = computed(() => this.#messagesQuery.data()?.items ?? []);
  readonly total = computed(() => this.#messagesQuery.data()?.total ?? 0);
  readonly unreadCount = computed(
    () => this.#messagesQuery.data()?.unreadCount ?? 0,
  );
  readonly totalPages = computed(
    () => this.#messagesQuery.data()?.totalPages ?? 0,
  );
  readonly loading = computed(() => this.#messagesQuery.isPending());

  readonly #markReadMutation = injectMarkMessageReadMutation();
  readonly #removeMutation = injectRemoveMessageMutation();

  setPage(page: number): void {
    this.page.set(page);
  }

  setIsRead(isRead: boolean | null): void {
    this.isRead.set(isRead);
    this.page.set(1);
  }

  markRead(id: string): void {
    this.#markReadMutation.mutate(id);
  }

  removeMessage(id: string): void {
    this.#removeMutation.mutate(id);
  }
}
