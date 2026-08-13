import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type { CategoryModel } from '../../products/models/product';

@Injectable({ providedIn: 'root' })
export class CategoryFormService {
  readonly #fb = inject(FormBuilder);

  readonly #form = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    sortOrder: [0],
    isActive: [true],
  });

  patchFromCategory(category: CategoryModel) {
    this.#form.patchValue(category);
  }

  resetForm() {
    this.#form.reset();
  }

  get form() {
    return this.#form;
  }
}
