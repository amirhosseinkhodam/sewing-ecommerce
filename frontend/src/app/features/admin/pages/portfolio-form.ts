import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormField, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Delete01Icon, Upload04Icon } from '@hugeicons/core-free-icons';
import { UploadService } from '@core/services/upload';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import { TextareaComponent } from '@shared/components/textarea';
import { ToggleComponent } from '@shared/components/toggle';
import type { SelectOption } from '@shared/models/select';
import { TranslatePipe } from '@shared/pipes/translate';
import { LanguageService } from '@shared/services/language';
import { NotificationService } from '@shared/services/notification';
import { PortfolioFormService } from '../forms/portfolio';
import { PortfolioFormStore } from '../store/portfolio-form';

@Component({
  selector: 'app-admin-portfolio-form',
  imports: [
    FormField,
    ButtonComponent,
    CardComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    HugeiconsIconComponent,
    InputComponent,
    LoadingSpinnerComponent,
    SelectComponent,
    TextareaComponent,
    ToggleComponent,
    TranslatePipe,
  ],
  providers: [PortfolioFormStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{
          id()
            ? ('editPortfolioItem' | translate)
            : ('newPortfolioItem' | translate)
        }}
      </h1>

      @if (store.loading()) {
        <div class="flex justify-center py-16">
          <app-loading-spinner
            size="lg"
            cssClass="text-slate-400 dark:text-slate-500"
          />
        </div>
      } @else {
        <app-signal-form
          (formSubmit)="onSubmit()"
          cssClass="flex flex-col gap-6"
        >
          <app-card variant="bordered">
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-input
                    [formField]="portfolioForm.form.title"
                    [label]="'title' | translate"
                    [placeholder]="'title' | translate"
                  />
                  <app-signal-form-field [field]="portfolioForm.form.title" />
                </div>
                <div>
                  <app-input
                    [formField]="portfolioForm.form.slug"
                    [label]="'slug' | translate"
                    [placeholder]="'slug' | translate"
                  />
                </div>
              </div>

              <div>
                <app-textarea
                  [formField]="portfolioForm.form.description"
                  [label]="'description' | translate"
                  [placeholder]="'description' | translate"
                  [rows]="4"
                />
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <app-select
                    [formField]="portfolioForm.form.categoryId"
                    [options]="categoryOptions()"
                    [label]="'category' | translate"
                    [placeholder]="'category' | translate"
                  />
                </div>
                <div class="flex items-end pb-2">
                  <app-toggle
                    [formField]="portfolioForm.form.isActive"
                    [label]="'isActive' | translate"
                  />
                </div>
              </div>
            </div>
          </app-card>

          <app-card variant="bordered">
            <h2
              class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4"
            >
              {{ 'images' | translate }}
            </h2>
            <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
              @for (
                image of portfolioForm.images;
                track image;
                let i = $index
              ) {
                <div
                  class="relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <img [src]="image" class="h-full w-full object-cover" />
                  <button
                    type="button"
                    class="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
                    [attr.aria-label]="'removeImage' | translate"
                    (click)="onRemoveImage(i)"
                  >
                    <hugeicons-icon
                      [icon]="icons.Delete01Icon"
                      [size]="14"
                      color="currentColor"
                      [strokeWidth]="1.5"
                    />
                  </button>
                </div>
              }
              <button
                type="button"
                class="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                [disabled]="uploading()"
                (click)="fileInput.click()"
              >
                @if (uploading()) {
                  <app-loading-spinner size="sm" cssClass="text-current" />
                } @else {
                  <hugeicons-icon
                    [icon]="icons.Upload04Icon"
                    [size]="24"
                    color="currentColor"
                    [strokeWidth]="1.5"
                  />
                }
                <span class="text-xs">
                  {{
                    uploading()
                      ? ('uploading' | translate)
                      : ('uploadImages' | translate)
                  }}
                </span>
              </button>
              <input
                #fileInput
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                (change)="onFilesSelected($event)"
              />
            </div>
          </app-card>

          <div class="flex gap-3">
            <app-button
              type="submit"
              variant="primary"
              [loading]="store.saving()"
            >
              {{ 'save' | translate }}
            </app-button>
            <app-button variant="secondary" (buttonClick)="onCancel()">
              {{ 'cancel' | translate }}
            </app-button>
          </div>
        </app-signal-form>
      }
    </div>
  `,
})
export class AdminPortfolioFormComponent implements OnInit {
  /** Present in edit mode only; bound from the route. */
  readonly id = input<string>();

  readonly store = inject(PortfolioFormStore);
  readonly portfolioForm = inject(PortfolioFormService);

  readonly icons = { Upload04Icon, Delete01Icon };

  readonly uploading = signal(false);

  readonly #router = inject(Router);
  readonly #upload = inject(UploadService);
  readonly #notification = inject(NotificationService);
  readonly #language = inject(LanguageService);
  readonly #destroyRef = inject(DestroyRef);

  readonly #formApplied = signal(false);

  constructor() {
    // Patch only on first arrival, so a later store emission cannot clobber
    // edits already in progress.
    effect(() => {
      const item = this.store.item();
      if (item && !this.#formApplied()) {
        this.#formApplied.set(true);
        this.portfolioForm.patchFromPortfolio(item);
      }
    });
  }

  readonly categoryOptions = (): SelectOption[] =>
    this.store
      .categories()
      .map((category) => ({ value: category.id, label: category.name }));

  ngOnInit() {
    this.portfolioForm.resetForm();
    const id = this.id();
    if (id) this.store.loadItem(id);
  }

  onRemoveImage(index: number) {
    this.portfolioForm.setImages(
      this.portfolioForm.images.filter((_, i) => i !== index),
    );
  }

  onFilesSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    fileInput.value = '';
    if (files.length === 0) return;

    this.uploading.set(true);
    this.#upload
      .uploadMultiple(files)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ urls }) => {
          this.uploading.set(false);
          this.portfolioForm.setImages([...this.portfolioForm.images, ...urls]);
        },
        error: () => {
          this.uploading.set(false);
          this.#notification.show(
            'error',
            this.#language.translate('uploadFailed'),
          );
        },
      });
  }

  onSubmit() {
    void submit(this.portfolioForm.form, async () => {
      this.store.save({
        id: this.id(),
        payload: this.portfolioForm.payload,
      });
    });
  }

  onCancel() {
    this.#router.navigate(['/admin/portfolio']);
  }
}
