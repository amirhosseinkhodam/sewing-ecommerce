import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Image01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [HugeiconsIconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-3">
      <div
        class="aspect-square overflow-hidden rounded-card bg-slate-100 dark:bg-slate-800"
      >
        @if (images().length > 0) {
          <img
            [src]="images()[activeIndex()]"
            [alt]="alt()"
            class="h-full w-full object-cover"
          />
        } @else {
          <div
            class="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <hugeicons-icon
              [icon]="Image01Icon"
              [size]="48"
              color="currentColor"
              [strokeWidth]="1.5"
            />
          </div>
        }
      </div>

      @if (images().length > 1) {
        <div class="flex gap-2 overflow-x-auto pb-1">
          @for (image of images(); track image; let i = $index) {
            <button
              type="button"
              class="h-20 w-20 shrink-0 overflow-hidden rounded-card border-2 transition-colors"
              [class]="
                i === activeIndex()
                  ? 'border-slate-900 dark:border-slate-400'
                  : 'border-transparent'
              "
              (click)="activeIndex.set(i)"
            >
              <img
                [src]="image"
                [alt]="alt()"
                class="h-full w-full object-cover"
              />
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ImageGalleryComponent {
  readonly images = input<string[]>([]);
  readonly alt = input<string>('');

  readonly activeIndex = signal(0);

  readonly Image01Icon = Image01Icon;
}
