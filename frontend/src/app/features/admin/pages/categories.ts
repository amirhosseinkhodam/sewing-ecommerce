import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  PlusSignIcon,
  Edit01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons';
import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { FormComponent } from '@shared/components/form';
import { FormFieldComponent } from '@shared/components/form-field';
import { InputComponent } from '@shared/components/input';
import { TextareaComponent } from '@shared/components/textarea';
import { ToggleComponent } from '@shared/components/toggle';
import { ModalService } from '@shared/services/modal';
import { TranslatePipe } from '@shared/pipes/translate';
import type { CategoryModel } from '../../products/models/product';
import { CategoryFormService } from '../forms/category';
import { AdminCategoryStore } from '../store/category';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HugeiconsIconComponent,
    ButtonComponent,
    CardComponent,
    FormComponent,
    FormFieldComponent,
    InputComponent,
    TextareaComponent,
    ToggleComponent,
    TranslatePipe,
  ],
  providers: [AdminCategoryStore],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'manageCategories' | translate }}
        </h1>
        <app-button variant="primary" (buttonClick)="onAdd()">
          <hugeicons-icon
            [icon]="icons.PlusSignIcon"
            [size]="18"
            color="currentColor"
            [strokeWidth]="2"
          />
          {{ 'addCategory' | translate }}
        </app-button>
      </div>

      @if (formOpen()) {
        <app-card variant="bordered">
          <h2
            class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {{
              editingId()
                ? ('editCategory' | translate)
                : ('addCategory' | translate)
            }}
          </h2>
          <app-form
            [formGroup]="categoryForm.form"
            (formSubmit)="onSubmit()"
            cssClass="flex flex-col gap-4"
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <app-input
                  formControlName="name"
                  [label]="'categoryName' | translate"
                  [placeholder]="'categoryName' | translate"
                />
                <app-form-field [control]="categoryForm.form.get('name')!" />
              </div>
              <div>
                <app-input
                  formControlName="slug"
                  [label]="'slug' | translate"
                  [placeholder]="'slug' | translate"
                />
              </div>
            </div>

            <div>
              <app-textarea
                formControlName="description"
                [label]="'description' | translate"
                [placeholder]="'description' | translate"
                [rows]="3"
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <app-input
                  type="number"
                  formControlName="sortOrder"
                  [label]="'sortOrder' | translate"
                />
              </div>
              <div class="flex items-end pb-2">
                <app-toggle
                  formControlName="isActive"
                  [label]="'isActive' | translate"
                />
              </div>
            </div>

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
          </app-form>
        </app-card>
      }

      <app-card variant="bordered" padding="none">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="border-b border-slate-200 dark:border-slate-700 text-start text-slate-500 dark:text-slate-400"
              >
                <th class="px-4 py-3 text-start font-medium">
                  {{ 'categoryName' | translate }}
                </th>
                <th class="px-4 py-3 text-start font-medium">
                  {{ 'slug' | translate }}
                </th>
                <th class="px-4 py-3 text-start font-medium">
                  {{ 'sortOrder' | translate }}
                </th>
                <th class="px-4 py-3 text-start font-medium">
                  {{ 'isActive' | translate }}
                </th>
                <th class="px-4 py-3 text-end font-medium">
                  {{ 'actions' | translate }}
                </th>
              </tr>
            </thead>
            <tbody>
              @for (category of store.categories(); track category.id) {
                <tr
                  class="border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td
                    class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100"
                  >
                    {{ category.name }}
                  </td>
                  <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {{ category.slug }}
                  </td>
                  <td class="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {{ category.sortOrder }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="
                        category.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      "
                    >
                      {{
                        category.isActive
                          ? ('yes' | translate)
                          : ('no' | translate)
                      }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <app-button
                        variant="ghost"
                        ariaLabel="Edit"
                        (buttonClick)="onEdit(category)"
                      >
                        <hugeicons-icon
                          [icon]="icons.Edit01Icon"
                          [size]="18"
                          color="currentColor"
                          [strokeWidth]="1.5"
                        />
                      </app-button>
                      <app-button
                        variant="ghost"
                        ariaLabel="Delete"
                        cssClass="!text-red-600 dark:!text-red-400"
                        (buttonClick)="onDelete(category)"
                      >
                        <hugeicons-icon
                          [icon]="icons.Delete01Icon"
                          [size]="18"
                          color="currentColor"
                          [strokeWidth]="1.5"
                        />
                      </app-button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="5"
                    class="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    {{ 'noData' | translate }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>
    </div>
  `,
})
export class AdminCategoriesComponent implements OnInit {
  readonly store = inject(AdminCategoryStore);
  readonly categoryForm = inject(CategoryFormService);

  readonly icons = { PlusSignIcon, Edit01Icon, Delete01Icon };

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly #modal = inject(ModalService);

  ngOnInit() {
    this.store.loadCategories();
  }

  onAdd() {
    this.editingId.set(null);
    this.categoryForm.resetForm();
    this.formOpen.set(true);
  }

  onEdit(category: CategoryModel) {
    this.editingId.set(category.id);
    this.categoryForm.patchFromCategory(category);
    this.formOpen.set(true);
  }

  onCancel() {
    this.formOpen.set(false);
    this.categoryForm.resetForm();
  }

  onSubmit() {
    this.store.saveCategory({
      id: this.editingId() ?? undefined,
      payload: this.categoryForm.form.getRawValue(),
    });
    this.formOpen.set(false);
  }

  onDelete(category: CategoryModel) {
    this.#modal
      .open({
        title: 'confirmDeleteTitle',
        description: 'confirmDeleteCategory',
        confirmLabel: 'delete',
        cancelLabel: 'cancel',
      })
      .subscribe((confirmed) => {
        if (confirmed) this.store.removeCategory(category.id);
      });
  }
}
