import { inject } from '@angular/core';
import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_KEYS } from '@shared/const/query-keys';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { AdminMessageService } from '../services/admin-message';

/** Marking read also moves the unread count, so the list is refetched. */
export function injectMarkMessageReadMutation() {
  const messageService = inject(AdminMessageService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(messageService.markRead(id)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminMessages] }),
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}

export function injectRemoveMessageMutation() {
  const messageService = inject(AdminMessageService);
  const queryClient = inject(QueryClient);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(messageService.remove(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.adminMessages],
      });
      feedback.success('messageDeleted');
    },
    onError: (error) => feedback.error(error, 'couldNotDelete'),
  }));
}
