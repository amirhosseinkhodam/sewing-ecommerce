import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/components/button';
import { ImageGalleryComponent } from '@shared/components/image-gallery';
import { SkeletonComponent } from '@shared/components/skeleton';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { TranslatePipe } from '@shared/pipes/translate';
import { PortfolioStore } from '../store/portfolio';

@Component({
  selector: 'app-portfolio-detail',
  imports: [
    ButtonComponent,
    ImageGalleryComponent,
    SkeletonComponent,
    LocalizedDatePipe,
    TranslatePipe,
  ],
  providers: [PortfolioStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      @if (store.loading() && !store.item()) {
        <div
          class="grid grid-cols-1 gap-8 lg:grid-cols-2"
          role="status"
          aria-live="polite"
        >
          <span class="sr-only">{{ 'loading' | translate }}</span>
          <app-skeleton cssClass="aspect-square w-full rounded-card" />
          <div class="flex flex-col gap-3">
            <app-skeleton cssClass="h-8 w-3/4" />
            <app-skeleton cssClass="h-4 w-32" />
            <app-skeleton cssClass="h-3 w-24" />
            <app-skeleton cssClass="mt-4 h-24 w-full" />
          </div>
        </div>
      } @else if (store.item(); as item) {
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <app-image-gallery [images]="item.images" [alt]="item.title" />

          <div class="flex flex-col">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ item.title }}
            </h1>
            @if (item.category; as category) {
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {{ category.name }}
              </p>
            }
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {{ item.createdAt | localizedDate }}
            </p>

            @if (item.description; as description) {
              <p
                class="text-sm text-slate-600 dark:text-slate-300 mt-6 whitespace-pre-line"
              >
                {{ description }}
              </p>
            }

            <div class="flex flex-wrap gap-3 mt-8">
              <app-button variant="secondary" (buttonClick)="onBack()">
                {{ 'portfolio' | translate }}
              </app-button>
              <app-button variant="primary" (buttonClick)="onContact()">
                {{ 'getInTouch' | translate }}
              </app-button>
            </div>
          </div>
        </div>
      } @else {
        <div
          class="flex flex-col items-center gap-4 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center"
        >
          <p class="text-lg font-medium text-slate-900 dark:text-slate-100">
            {{ 'portfolioNotFound' | translate }}
          </p>
          <app-button variant="primary" (buttonClick)="onBack()">
            {{ 'portfolio' | translate }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class PortfolioDetailComponent implements OnInit {
  /** Bound from the route via `withComponentInputBinding`. */
  readonly slug = input.required<string>();

  readonly store = inject(PortfolioStore);

  readonly #router = inject(Router);

  ngOnInit() {
    this.store.loadItem(this.slug());
  }

  onBack() {
    void this.#router.navigate(['/portfolio']);
  }

  onContact() {
    void this.#router.navigate(['/contact']);
  }
}
