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
 * Placeholder grid of image-top, text-below cards — matches the bordered
 * card shape used by `ProductCardComponent` and the portfolio item buttons.
 * Callers pass their own grid classes via `cssClass` so column counts stay
 * in sync with the real grid they're replacing.
 */
@Component({
  selector: 'app-skeleton-grid',
  imports: [CardComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div [class]="cssClass() ?? ''" role="status" aria-live="polite">
      <span class="sr-only">{{ 'loading' | translate }}</span>
      @for (tile of tileIndexes(); track tile) {
        <app-card variant="bordered" padding="none" cssClass="overflow-hidden">
          <app-skeleton cssClass="aspect-square w-full rounded-none" />
          <div class="flex flex-col gap-2 p-4">
            <app-skeleton cssClass="h-3 w-1/3" />
            <app-skeleton cssClass="h-4 w-3/4" />
            <app-skeleton cssClass="h-4 w-1/4" />
          </div>
        </app-card>
      }
    </div>
  `,
})
export class SkeletonGridComponent {
  readonly count = input<number>(8);
  readonly cssClass = input<string>();

  readonly tileIndexes = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
}
