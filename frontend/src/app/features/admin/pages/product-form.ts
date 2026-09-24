import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Upload04Icon,
  Delete01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { SignalFormComponent } from '@shared/components/signal-form';
import { SignalFormFieldComponent } from '@shared/components/signal-form-field';
import { InputComponent } from '@shared/components/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner';
import { SelectComponent } from '@shared/components/select';
import { TextareaComponent } from '@shared/components/textarea';
import { ToggleComponent } from '@shared/components/toggle';
import { UploadService } from '@core/services/upload';
import { TranslatePipe } from '@shared/pipes/translate';
import { NotificationService } from '@shared/services/notification';
import { LanguageService } from '@shared/services/language';
import { SelectOption } from '@shared/models/select';
import { ProductFormService } from '../forms/product';
import { ProductFormStore } from '../store/product-form';

@Component({
  selector: 'app-product-form',
  imports: [
    FormField,
    HugeiconsIconComponent,
    ButtonComponent,
    CardComponent,
    SignalFormComponent,
    SignalFormFieldComponent,
    InputComponent,
    LoadingSpinnerComponent,
    SelectComponent,
    TextareaComponent,
    ToggleComponent,
    TranslatePipe,
  ],
  providers: [ProductFormStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{
            editing() ? ('editProduct' | translate) : ('newProduct' | translate)
          }}
        </h1>
        <app-button variant="secondary" (buttonClick)="onCancel()">
          {{ 'back' | translate }}
        </app-button>
      </div>

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
                    [formField]="productForm.form.name"
                    [label]="'productName' | translate"
                    [placeholder]="'productName' | translate"
                  />
                  <app-signal-form-field [field]="productForm.form.name" />
                </div>
                <div>
                  <app-input
                    [formField]="productForm.form.slug"
                    [label]="'slug' | translate"
                    [placeholder]="'slug' | translate"
                  />
                </div>
              </div>

              <div>
                <app-textarea
                  [formField]="productForm.form.description"
                  [label]="'description' | translate"
                  [placeholder]="'description' | translate"
                  [rows]="3"
                />
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <app-input
                    type="number"
                    [formField]="productForm.form.price"
                    [label]="'price' | translate"
                  />
                  <app-signal-form-field [field]="productForm.form.price" />
                </div>
                <div>
                  <app-input
                    [formField]="productForm.form.fabric"
                    [label]="'fabric' | translate"
                    [placeholder]="'fabric' | translate"
                  />
                </div>
                <div>
                  <app-select
                    [formField]="productForm.form.categoryId"
                    [label]="'category' | translate"
                    [placeholder]="'selectCategory' | translate"
                    [options]="categoryOptions()"
                    [clearable]="true"
                  />
                  <app-signal-form-field
                    [field]="productForm.form.categoryId"
                  />
                </div>
              </div>

              <div class="flex flex-wrap gap-8">
                <app-toggle
                  [formField]="productForm.form.isActive"
                  [label]="'isActive' | translate"
                />
                <app-toggle
                  [formField]="productForm.form.isFeatured"
                  [label]="'isFeatured' | translate"
                />
              </div>
            </div>
          </app-card>

          <app-card variant="bordered">
            <h2
              class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ 'images' | translate }}
            </h2>
            <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
              @for (image of productForm.images; track image; let i = $index) {
                <div
                  class="relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <img [src]="image" class="h-full w-full object-cover" />
                  <button
                    type="button"
                    class="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
                    [attr.aria-label]="'removeImage' | translate"
                    (click)="productForm.removeImage(i)"
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

          <app-card variant="bordered">
            <div class="flex items-center justify-between">
              <h2
                class="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {{ 'sizes' | translate }}
              </h2>
              <app-button
                variant="secondary"
                (buttonClick)="productForm.addVariant()"
              >
                <hugeicons-icon
                  [icon]="icons.PlusSignIcon"
                  [size]="16"
                  color="currentColor"
                  [strokeWidth]="2"
                />
                {{ 'addVariant' | translate }}
              </app-button>
            </div>

            <div class="mt-4 flex flex-col gap-4">
              @for (
                variant of productForm.form.variants;
                track $index;
                let i = $index
              ) {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <app-input
                      [formField]="variant.size"
                      [label]="'size' | translate"
                      placeholder="M"
                    />
                    <app-signal-form-field [field]="variant.size" />
                  </div>
                  <div>
                    <app-input
                      type="number"
                      [formField]="variant.stock"
                      [label]="'stock' | translate"
                    />
                    <app-signal-form-field [field]="variant.stock" />
                  </div>
                  <div class="flex items-end justify-end pb-2">
                    <app-button
                      variant="ghost"
                      ariaLabel="Remove variant"
                      cssClass="!text-red-600 dark:!text-red-400"
                      (buttonClick)="productForm.removeVariant(i)"
                    >
                      <hugeicons-icon
                        [icon]="icons.Delete01Icon"
                        [size]="18"
                        color="currentColor"
                        [strokeWidth]="1.5"
                      />
                    </app-button>
                  </div>
                </div>
              }
            </div>
          </app-card>

          <div class="flex gap-3">
            <app-button
              type="submit"
              variant="primary"
              size="lg"
              [loading]="store.saving()"
            >
              {{ 'save' | translate }}
            </app-button>
            <app-button
              variant="secondary"
              size="lg"
              (buttonClick)="onCancel()"
            >
              {{ 'cancel' | translate }}
            </app-button>
          </div>
        </app-signal-form>
      }
    </div>
  `,
})
export class AdminProductFormComponent implements OnInit {
  readonly store = inject(ProductFormStore);
  readonly productForm = inject(ProductFormService);

  readonly icons = { Upload04Icon, Delete01Icon, PlusSignIcon };

  readonly editing = signal(false);
  readonly uploading = signal(false);
  readonly #productId = signal<string | null>(null);
  readonly #formApplied = signal(false);

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #uploadService = inject(UploadService);
  readonly #notification = inject(NotificationService);
  readonly #languageService = inject(LanguageService);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const product = this.store.product();
      if (product && !this.#formApplied()) {
        this.#formApplied.set(true);
        this.productForm.patchFromProduct(product);
      }
    });
  }

  ngOnInit() {
    this.productForm.resetForm();
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.#productId.set(id);
      this.editing.set(true);
      this.store.loadProduct(id);
    }
  }

  readonly categoryOptions = (): SelectOption[] =>
    this.store.categories().map((category) => ({
      value: category.id,
      label: category.name,
    }));

  onSubmit() {
    void submit(this.productForm.form, async () => {
      this.store.save({
        id: this.#productId() ?? undefined,
        payload: this.productForm.payload,
      });
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    this.uploading.set(true);
    this.#uploadService
      .uploadMultiple(files)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ urls }) => {
          this.uploading.set(false);
          for (const url of urls) {
            this.productForm.addImage(url);
          }
        },
        error: () => {
          this.uploading.set(false);
          this.#notification.show(
            'error',
            this.#languageService.translate('uploadFailed'),
          );
        },
      });
  }

  onCancel() {
    this.#router.navigate(['/admin/products']);
  }
}
