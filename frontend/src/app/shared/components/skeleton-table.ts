import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CardComponent } from './card';
import { SkeletonComponent } from './skeleton';
import { TranslatePipe } from '../pipes/translate';

/**
 * Placeholder for the `app-card` + `<table>` shell every admin list page
 * builds inline, so swapping in real rows causes no layout jump.
 */
@Component({
  selector: 'app-skeleton-table',
  imports: [CardComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-card variant="bordered" padding="none">
      <div class="overflow-x-auto" role="status" aria-live="polite">
        <span class="sr-only">{{ 'loading' | translate }}</span>
        <table class="w-full text-sm">
          @if (showHeader()) {
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                @for (col of columnIndexes(); track col) {
                  <th class="px-4 py-3">
                    <app-skeleton cssClass="h-3 w-20" />
                  </th>
                }
              </tr>
            </thead>
          }
          <tbody>
            @for (row of rowIndexes(); track row) {
              <tr
                class="border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                @for (col of columnIndexes(); track col) {
                  <td class="px-4 py-3">
                    <app-skeleton cssClass="h-4 w-full max-w-32" />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-card>
  `,
})
export class SkeletonTableComponent {
  readonly columns = input.required<number>();
  readonly rows = input<number>(5);
  readonly showHeader = input<boolean>(true);

  readonly columnIndexes = computed(() =>
    Array.from({ length: this.columns() }, (_, i) => i),
  );
  readonly rowIndexes = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i),
  );
}
