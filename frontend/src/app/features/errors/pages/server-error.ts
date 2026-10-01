import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import Alert02Icon from '@hugeicons/core-free-icons/Alert02Icon';

import { ButtonComponent } from '@shared/components/button';
import { TranslatePipe } from '@shared/pipes/translate';

/**
 * Shown when a navigation fails (e.g. a lazy chunk can't load). The router
 * renders it with `skipLocationChange`, so the address bar keeps the failed
 * URL and "refresh" retries it.
 */
@Component({
  selector: 'app-server-error',
  imports: [ButtonComponent, HugeiconsIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6"
    >
      <hugeicons-icon
        [icon]="icons.Alert02Icon"
        [size]="48"
        color="currentColor"
        [strokeWidth]="1.5"
        class="text-slate-400 dark:text-slate-500"
      />
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ 'serverError' | translate }}
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        {{ 'serverErrorMessage' | translate }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <app-button variant="primary" (buttonClick)="onRefresh()">
          {{ 'refresh' | translate }}
        </app-button>
        <app-button variant="secondary" (buttonClick)="onGoHome()">
          {{ 'goHome' | translate }}
        </app-button>
      </div>
    </div>
  `,
})
export class ServerErrorComponent {
  readonly icons = { Alert02Icon };

  readonly #router = inject(Router);

  onRefresh() {
    window.location.reload();
  }

  onGoHome() {
    void this.#router.navigate(['/']);
  }
}
