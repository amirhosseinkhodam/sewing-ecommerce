import { Service, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LanguageService } from '@core/i18n/language';

/**
 * User-facing transient messages, via Material's snackbar.
 *
 * Replaces the previous hand-rolled NotificationService + <app-notification>
 * toast component and its manual timer bookkeeping.
 */
@Service()
export class Notify {
  readonly #snackBar = inject(MatSnackBar);
  readonly #i18n = inject(LanguageService);

  /** Shows an already-resolved message. */
  show(message: string): void {
    this.#snackBar.open(message, this.#i18n.translate('close'), {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  /** Translates a dictionary key, then shows it. */
  showKey(key: string, params?: Record<string, string | number>): void {
    this.show(this.#i18n.translate(key, params));
  }
}
