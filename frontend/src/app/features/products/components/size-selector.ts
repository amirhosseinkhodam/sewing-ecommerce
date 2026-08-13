import { Component, effect, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate';
import type { ProductVariantModel } from '../models/product';

@Component({
  selector: 'app-size-selector',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-wrap gap-2">
      @for (variant of variants(); track variant.id) {
        <button
          type="button"
          [disabled]="variant.stock === 0"
          [class]="sizeClasses(variant.id)"
          (click)="onSelect(variant)"
        >
          {{ variant.size }}
          @if (variant.stock === 0) {
            <span class="sr-only"> ({{ 'outOfStock' | translate }}) </span>
          }
        </button>
      }
    </div>
  `,
})
export class SizeSelectorComponent {
  readonly variants = input.required<ProductVariantModel[]>();
  readonly selectedSize = input<string | null>(null);

  readonly sizeChange = output<ProductVariantModel>();

  readonly selected = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.selected.set(this.selectedSize());
    });
  }

  readonly sizeClasses = (id: string) => {
    const base =
      'min-w-12 rounded-control border px-3 py-2 text-sm font-medium transition-colors';
    const isSelected = this.selected() === id;
    if (isSelected) {
      return `${base} border-slate-900 dark:border-slate-400 bg-slate-900 dark:bg-slate-500 text-white`;
    }
    return `${base} border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600`;
  };

  onSelect(variant: ProductVariantModel) {
    if (variant.stock === 0) return;
    this.selected.set(variant.id);
    this.sizeChange.emit(variant);
  }
}
