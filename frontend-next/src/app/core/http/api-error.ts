import { HttpErrorResponse } from '@angular/common/http';

/**
 * The backend normalizes every failure to `{ statusCode, message }` via its
 * global HttpExceptionFilter (PROJECT_KNOWLEDGE.md §9). This is the only place
 * in the app that knows that shape.
 *
 * @param fallback message to use when the body carries none — pass an already
 * translated string.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.length > 0) return message;
    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );
      if (messages.length > 0) return messages.join(', ');
    }
  }
  return fallback;
}
