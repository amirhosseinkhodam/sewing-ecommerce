import { Injectable, signal } from '@angular/core';
import { applyEach, form, required, validate } from '@angular/forms/signals';
import type {
  ProductDetailModel,
  ProductPayloadModel,
  ProductVariantModel,
} from '../../products/models/product';

interface VariantFormModel {
  size: string;
  /** Held as a string: `app-input` is a `FormValueControl<string>`. */
  stock: string;
}

interface ProductFormModel {
  name: string;
  slug: string;
  description: string;
  price: string;
  fabric: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  variants: VariantFormModel[];
}

const NEW_VARIANT: VariantFormModel = { size: '', stock: '0' };

const EMPTY: ProductFormModel = {
  name: '',
  slug: '',
  description: '',
  price: '0',
  fabric: '',
  categoryId: '',
  isActive: true,
  isFeatured: false,
  images: [],
  variants: [{ ...NEW_VARIANT }],
};

/** Rejects blanks and non-numeric input; `min` alone would accept "abc". */
function numberAtLeast(min: number, message: string) {
  return ({ value }: { value: () => string }) => {
    const parsed = Number(value());
    return value().trim() === '' || Number.isNaN(parsed) || parsed < min
      ? { kind: 'min', message }
      : undefined;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductFormService {
  readonly model = signal<ProductFormModel>(structuredClone(EMPTY));
  readonly form = form(this.model, (path) => {
    required(path.name, { message: 'validation.required' });
    required(path.categoryId, { message: 'validation.required' });
    validate(path.price, numberAtLeast(1, 'validation.required'));
    applyEach(path.variants, (variant) => {
      required(variant.size, { message: 'validation.required' });
      validate(variant.stock, numberAtLeast(0, 'validation.required'));
    });
  });

  get images(): string[] {
    return this.model().images;
  }

  get variants(): VariantFormModel[] {
    return this.model().variants;
  }

  addImage(url: string) {
    this.model.update((value) => ({
      ...value,
      images: [...value.images, url],
    }));
  }

  removeImage(index: number) {
    this.model.update((value) => ({
      ...value,
      images: value.images.filter((_, i) => i !== index),
    }));
  }

  addVariant() {
    this.model.update((value) => ({
      ...value,
      variants: [...value.variants, { ...NEW_VARIANT }],
    }));
  }

  removeVariant(index: number) {
    this.model.update((value) => ({
      ...value,
      variants: value.variants.filter((_, i) => i !== index),
    }));
  }

  patchFromProduct(product: ProductDetailModel) {
    this.model.set({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: String(product.price),
      fabric: product.fabric ?? '',
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      images: [...product.images],
      variants: product.variants.map((variant: ProductVariantModel) => ({
        size: variant.size,
        stock: String(variant.stock),
      })),
    });
  }

  resetForm() {
    this.model.set(structuredClone(EMPTY));
    this.form().reset();
  }

  get payload(): ProductPayloadModel {
    const value = this.model();
    return {
      name: value.name.trim(),
      slug: value.slug.trim() || undefined,
      description: value.description.trim() || undefined,
      price: Number(value.price),
      fabric: value.fabric.trim() || undefined,
      images: value.images,
      categoryId: value.categoryId,
      isActive: value.isActive,
      isFeatured: value.isFeatured,
      variants: value.variants.map((variant) => ({
        size: variant.size.trim(),
        stock: Number(variant.stock),
      })),
    };
  }
}
