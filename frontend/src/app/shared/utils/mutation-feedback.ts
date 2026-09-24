import { inject } from '@angular/core';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { apiErrorMessage } from './api-error';

export interface MutationFeedback {
  /** Shows a translated success toast. */
  readonly success: (messageKey: string) => void;
  /** Shows the server's message, falling back to a translated key. */
  readonly error: (error: unknown, fallbackKey: string) => void;
  /** Shows a translated message, ignoring whatever the server said. */
  readonly errorMessage: (messageKey: string) => void;
}

/**
 * Toast helpers for a mutation. Translating at call time (not at injection
 * time) keeps messages correct after a language switch.
 *
 * Must be called in an injection context.
 */
export function injectMutationFeedback(): MutationFeedback {
  const notification = inject(NotificationService);
  const language = inject(LanguageService);

  return {
    success: (messageKey) =>
      notification.show('success', language.translate(messageKey)),
    error: (error, fallbackKey) =>
      notification.show(
        'error',
        apiErrorMessage(error, language.translate(fallbackKey)),
      ),
    errorMessage: (messageKey) =>
      notification.show('error', language.translate(messageKey)),
  };
}
