import { inject } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import type { ContactPayloadModel } from '@domain/models/contact';
import { injectMutationFeedback } from '@shared/utils/mutation-feedback';
import { ContactService } from '../services/contact';

/**
 * Public contact form submission (unauthenticated). Nothing is cached — the
 * endpoint returns only `{ submitted: true }`.
 */
export function injectSubmitContactMutation(options?: {
  readonly onSuccess?: () => void;
}) {
  const contactService = inject(ContactService);
  const feedback = injectMutationFeedback();

  return injectMutation(() => ({
    mutationFn: (payload: ContactPayloadModel) =>
      firstValueFrom(contactService.submit(payload)),
    onSuccess: () => {
      feedback.success('messageSent');
      options?.onSuccess?.();
    },
    onError: (error) => feedback.error(error, 'couldNotSave'),
  }));
}
