import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import SearchRemoveIcon from '@hugeicons/core-free-icons/SearchRemoveIcon';

import { ButtonComponent } from '@shared/components/button';
import { TranslatePipe } from '@shared/pipes/translate';

/** Wildcard-route fallback for any URL that doesn't match a real page. */
@Component({
  selector: 'app-not-found',
  imports: [ButtonComponent, HugeiconsIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6"
    >
      <hugeicons-icon
        [icon]="icons.SearchRemoveIcon"
        [size]="48"
        color="currentColor"
        [strokeWidth]="1.5"
        class="text-slate-400 dark:text-slate-500"
      />
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ 'pageNotFound' | translate }}
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        {{ 'pageNotFoundMessage' | translate }}
      </p>
      <app-button variant="primary" (buttonClick)="onGoHome()">
        {{ 'goHome' | translate }}
      </app-button>
    </div>
  `,
})
export class NotFoundComponent {
  readonly icons = { SearchRemoveIcon };

  readonly #router = inject(Router);

  onGoHome() {
    void this.#router.navigate(['/']);
  }
}
