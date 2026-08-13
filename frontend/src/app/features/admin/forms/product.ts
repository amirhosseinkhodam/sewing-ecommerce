import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type {
  ProductDetailModel,
  ProductPayloadModel,
  ProductVariantModel,
} from '../../products/models/product';

@Injectable({ providedIn: 'root' })
export class ProductFormService {
  readonly #fb = inject(FormBuilder);

  readonly #form = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    price: [0, [Validators.required, Validators.min(1)]],
    fabric: [''],
    categoryId: ['', Validators.required],
    isActive: [true],
    isFeatured: [false],
    images: this.#fb.nonNullable.array<string>([]),
    variants: this.#fb.nonNullable.array([this.#newVariant()]),
  });

  get form() {
    return this.#form;
  }

  get images() {
    return this.#form.controls.images;
  }

  get variants() {
    return this.#form.controls.variants;
  }

  get payload(): ProductPayloadModel {
    const raw = this.#form.getRawValue();
    return {
      name: raw.name,
      slug: raw.slug || undefined,
      description: raw.description || undefined,
      price: Number(raw.price),
      fabric: raw.fabric || undefined,
      images: raw.images.filter((url): url is string => Boolean(url)),
      categoryId: raw.categoryId,
      isActive: raw.isActive,
      isFeatured: raw.isFeatured,
      variants: raw.variants.map((variant) => ({
        size: variant.size,
        stock: variant.stock,
      })),
    };
  }

  patchFromProduct(product: ProductDetailModel) {
    this.#form.patchValue({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: Number(product.price),
      fabric: product.fabric ?? '',
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    this.#setImages(product.images);
    this.#setVariants(product.variants);
  }

  resetForm() {
    this.#form.reset();
    this.#form.controls.images.clear();
    this.#form.controls.variants.clear();
    this.#form.controls.variants.push(this.#newVariant());
  }

  addImage(url: string) {
    this.#form.controls.images.push(this.#fb.nonNullable.control(url));
  }

  removeImage(index: number) {
    this.#form.controls.images.removeAt(index);
  }

  addVariant() {
    this.#form.controls.variants.push(this.#newVariant());
  }

  removeVariant(index: number) {
    this.#form.controls.variants.removeAt(index);
  }

  #setImages(images: string[]) {
    const imagesControl = this.#form.controls.images;
    imagesControl.clear();
    for (const url of images) {
      imagesControl.push(this.#fb.nonNullable.control(url));
    }
  }

  #setVariants(variants: ProductVariantModel[]) {
    const variantsControl = this.#form.controls.variants;
    variantsControl.clear();
    for (const variant of variants) {
      variantsControl.push(
        this.#fb.nonNullable.group({
          size: [variant.size],
          stock: [variant.stock],
        }),
      );
    }
  }

  #newVariant() {
    return this.#fb.nonNullable.group({
      size: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
    });
  }
}
