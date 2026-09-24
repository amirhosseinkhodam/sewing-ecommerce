import { Injectable, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import type {
  PortfolioModel,
  PortfolioPayloadModel,
} from '@domain/models/portfolio';

interface PortfolioFormModel {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  images: string[];
}

const EMPTY: PortfolioFormModel = {
  title: '',
  slug: '',
  description: '',
  categoryId: '',
  isActive: true,
  images: [],
};

@Injectable({ providedIn: 'root' })
export class PortfolioFormService {
  readonly model = signal<PortfolioFormModel>({ ...EMPTY });
  readonly form = form(this.model, (path) => {
    required(path.title, { message: 'validation.required' });
  });

  get images(): string[] {
    return this.model().images;
  }

  setImages(images: string[]) {
    this.model.update((value) => ({ ...value, images }));
  }

  patchFromPortfolio(item: PortfolioModel) {
    this.model.set({
      title: item.title,
      slug: item.slug,
      description: item.description ?? '',
      categoryId: item.categoryId ?? '',
      isActive: item.isActive,
      images: item.images,
    });
  }

  resetForm() {
    this.model.set({ ...EMPTY });
    this.form().reset();
  }

  /** Empty optional strings are dropped so the API keeps its own defaults. */
  get payload(): PortfolioPayloadModel {
    const value = this.model();
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
