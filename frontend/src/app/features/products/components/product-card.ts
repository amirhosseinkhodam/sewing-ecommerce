import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Image01Icon } from '@hugeicons/core-free-icons';
import type { ProductModel } from '../models/product';
import { CardComponent } from '@shared/components/card';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CardComponent,
    HugeiconsIconComponent,
    LocalizedNumberPipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-card
      variant="bordered"
      [cssClass]="'group h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-card-hover'"
      role="button"
      tabindex="0"
      (click)="open.emit(product())"
      (keydown.enter)="open.emit(product())"
    >
      <div
        class="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        @if (product().images[0]; as image) {
          <img
            [src]="image"
            [alt]="product().name"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        } @else {
          <div
            class="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <hugeicons-icon
              [icon]="Image01Icon"
              [size]="32"
              color="currentColor"
              [strokeWidth]="1.5"
            />
          </div>
        }
        @if (product().isFeatured) {
          <span
            class="absolute top-2 start-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white"
          >
            {{ 'featured' | translate }}
          </span>
        }
      </div>

      <div class="flex flex-col gap-1 p-4">
        @if (product().category) {
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ product().category?.name }}
          </p>
        }
        <h3
          class="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2"
        >
          {{ product().name }}
        </h3>
        <p class="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
          {{ product().price | localizedNumber }}
          <span class="text-xs font-normal text-slate-500 dark:text-slate-400">
            {{ 'currencyToman' | translate }}
          </span>
        </p>
      </div>
    </app-card>
  `,
})
export class ProductCardComponent {
  readonly product = input.required<ProductModel>();

  readonly open = output<ProductModel>({ alias: 'productClick' });

  readonly Image01Icon = Image01Icon;
}
