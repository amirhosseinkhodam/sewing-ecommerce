import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type {
  PortfolioModel,
  PortfolioPayloadModel,
} from '@domain/models/portfolio';

@Injectable({ providedIn: 'root' })
export class PortfolioFormService {
  readonly #fb = inject(FormBuilder);

  readonly #form = this.#fb.nonNullable.group({
    title: ['', Validators.required],
    slug: [''],
    description: [''],
    categoryId: [''],
    isActive: [true],
    images: this.#fb.nonNullable.control<string[]>([]),
  });

  patchFromPortfolio(item: PortfolioModel) {
    this.#form.patchValue({
      title: item.title,
      slug: item.slug,
      description: item.description ?? '',
      categoryId: item.categoryId ?? '',
      isActive: item.isActive,
      images: item.images,
    });
  }

  resetForm() {
    this.#form.reset({ isActive: true, images: [] });
  }

  get form() {
    return this.#form;
  }

  get images(): string[] {
    return this.#form.controls.images.value;
  }

  setImages(images: string[]) {
    this.#form.controls.images.setValue(images);
  }

  /** Empty optional strings are dropped so the API keeps its own defaults. */
  get payload(): PortfolioPayloadModel {
    const value = this.#form.getRawValue();
    return {
      title: value.title.trim(),
      slug: value.slug.trim() || undefined,
      description: value.description.trim() || undefined,
      categoryId: value.categoryId || undefined,
      isActive: value.isActive,
      images: value.images,
    };
  }
}
