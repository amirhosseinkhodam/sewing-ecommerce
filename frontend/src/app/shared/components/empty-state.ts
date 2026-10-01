import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ButtonComponent } from './button';
import { TranslatePipe } from '../pipes/translate';

/**
 * The "nothing to show" block repeated across list/detail pages — either
 * "there's genuinely no data" or "the fetch failed" — as one reusable
 * component instead of a copy-pasted Tailwind block per page.
 *
 * `titleKey` alone (e.g. a plain "Could not load data.") matches the
 * single-line error blocks; `titleKey` + `messageKey` matches the two-line
 * empty states (e.g. `noOrders` / `noOrdersMessage`).
 */
@Component({
  selector: 'app-empty-state',
  imports: [ButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      [class]="
        'flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center ' +
        (cssClass() ?? '')
      "
    >
      @if (messageKey(); as message) {
        <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
          {{ titleKey() | translate }}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ message | translate }}
        </p>
      } @else {
        <p class="text-slate-500 dark:text-slate-400">
          {{ titleKey() | translate }}
        </p>
      }
      @if (actionLabelKey(); as actionLabel) {
        <app-button variant="primary" (buttonClick)="actionClick.emit()">
          {{ actionLabel | translate }}
        </app-button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly titleKey = input.required<string>();
  /** Second line, muted. Omit for the single-line error-style block. */
  readonly messageKey = input<string>();
  /** Optional CTA — e.g. "refresh" on an error, or "start shopping" on empty. */
  readonly actionLabelKey = input<string>();
  readonly cssClass = input<string>();

  readonly actionClick = output<void>();
}
