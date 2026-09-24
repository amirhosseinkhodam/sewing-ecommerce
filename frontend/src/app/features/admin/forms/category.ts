import { Injectable, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import type { CategoryModel } from '../../products/models/product';

@Injectable({ providedIn: 'root' })
export class CategoryFormService {
  readonly model = signal({
    name: '',
    slug: '',
    description: '',
    sortOrder: '0',
    isActive: true,
  });
  readonly form = form(this.model, (path) => {
    required(path.name, { message: 'validation.required' });
  });

  patchFromCategory(category: CategoryModel) {
    this.model.set({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  resetForm() {
    this.form().reset();
  }
}
