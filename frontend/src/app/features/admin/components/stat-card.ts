import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HugeiconsIconComponent, type IconSvgObject } from '@hugeicons/angular';

import { CardComponent } from '@shared/components/card';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';

/** One figure on the dashboard: an icon, a translated label, and a number. */
@Component({
  selector: 'app-stat-card',
  imports: [
    CardComponent,
    HugeiconsIconComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-card variant="bordered">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ labelKey() | translate }}
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ value() | localizedNumber }}
            @if (suffixKey(); as suffix) {
              <span
                class="text-xs font-normal text-slate-500 dark:text-slate-400"
              >
                {{ suffix | translate }}
              </span>
            }
          </p>
        </div>
        <span [class]="iconClasses()">
          <hugeicons-icon
            [icon]="icon()"
            [size]="20"
            color="currentColor"
            [strokeWidth]="1.5"
          />
        </span>
      </div>
    </app-card>
  `,
})
export class StatCardComponent {
  readonly labelKey = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<IconSvgObject>();
  /** Translation key appended after the number, e.g. the currency unit. */
  readonly suffixKey = input<string>();
  readonly tone = input<'slate' | 'blue' | 'green' | 'amber' | 'purple'>(
    'slate',
  );

  readonly iconClasses = () => {
    const tones = {
      slate:
        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green:
        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      amber:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      purple:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    };
    return `shrink-0 rounded-lg p-2 ${tones[this.tone()]}`;
  };
}
