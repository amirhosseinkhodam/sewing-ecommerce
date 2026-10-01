import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * One pulsing placeholder bar/block. Callers supply size, radius, and aspect
 * via `cssClass` — same pattern as `CardComponent` — so this stays a single
 * reusable primitive instead of growing size/shape variant inputs.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      [class]="
        'animate-pulse motion-reduce:animate-none rounded bg-slate-200 dark:bg-slate-700 ' +
        (cssClass() ?? '')
      "
    ></div>
  `,
})
export class SkeletonComponent {
  readonly cssClass = input<string>();
}
