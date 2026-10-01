import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { TrendPointModel } from '@domain/models/dashboard';

import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';

/** Width/height of the SVG user space; the element scales to its container. */
const VIEW = { width: 720, height: 180 } as const;
const PADDING = { top: 8, bottom: 8 } as const;

interface ChartBar {
  readonly date: string;
  readonly orders: number;
  readonly revenue: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The daily orders/revenue trend, drawn as inline SVG. No charting library is
 * installed and one series of thin bars does not justify adding one; the
 * series is always dense (the API emits a zero bucket for empty days), so the
 * bars map one-to-one onto calendar days.
 *
 * `dir="ltr"` is pinned on the SVG: the x axis runs oldest-to-newest left to
 * right regardless of the page's RTL direction.
 */
@Component({
  selector: 'app-trend-chart',
  imports: [LocalizedNumberPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (bars().length === 0) {
      <p class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {{ 'noData' | translate }}
      </p>
    } @else {
      <svg
        dir="ltr"
        [attr.viewBox]="'0 0 ' + view.width + ' ' + view.height"
        preserveAspectRatio="none"
        class="h-44 w-full"
        role="img"
        [attr.aria-label]="'ordersTrend' | translate"
      >
        @for (bar of bars(); track bar.date) {
          <rect
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.width"
            [attr.height]="bar.height"
            rx="1.5"
            class="fill-slate-300 dark:fill-slate-600"
          >
            <title>{{ bar.date }} — {{ bar.orders | localizedNumber }}</title>
          </rect>
        }
      </svg>
      <div
        dir="ltr"
        class="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400"
      >
        <span>{{ bars()[0].date }}</span>
        <span>{{ bars()[bars().length - 1].date }}</span>
      </div>
    }
  `,
})
export class TrendChartComponent {
  readonly points = input.required<readonly TrendPointModel[]>();

  readonly view = VIEW;

  readonly bars = computed<ChartBar[]>(() => {
    const points = this.points();
    if (points.length === 0) return [];

    // A flat all-zero series would divide by zero, so the scale floors at 1 —
    // which also renders an empty window as a flat baseline rather than bars
    // at full height.
    const peak = Math.max(1, ...points.map((point) => point.orders));
    const slot = VIEW.width / points.length;
    const barWidth = Math.max(1, slot * 0.7);
    const plotHeight = VIEW.height - PADDING.top - PADDING.bottom;

    return points.map((point, index) => {
      const height = (point.orders / peak) * plotHeight;
      return {
        date: point.date,
        orders: point.orders,
        revenue: point.revenue,
        x: index * slot + (slot - barWidth) / 2,
        y: PADDING.top + (plotHeight - height),
        width: barWidth,
        height,
      };
    });
  });
}
