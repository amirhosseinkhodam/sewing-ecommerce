export interface CategoryModel {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly image?: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface ProductVariantModel {
  readonly id: string;
  readonly size: string;
  readonly stock: number;
  readonly price?: string;
}

export interface ProductModel {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly price: string;
  readonly fabric?: string;
  readonly images: string[];
  readonly categoryId: string;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
  readonly category?: CategoryModel;
  readonly variants: ProductVariantModel[];
}

export type ProductDetailModel = ProductModel;

export interface ProductListResponseModel {
  readonly items: ProductModel[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export const PRODUCT_SORTS = {
  newest: 'newest',
  priceAsc: 'priceAsc',
  priceDesc: 'priceDesc',
} as const;

export type ProductSort = (typeof PRODUCT_SORTS)[keyof typeof PRODUCT_SORTS];

export interface ProductQueryModel {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly category?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly sort?: ProductSort;
  readonly isFeatured?: boolean;
}

export interface ProductVariantPayloadModel {
  readonly size: string;
  readonly stock: number;
  readonly price?: number;
}

export interface ProductPayloadModel {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly price: number;
  readonly fabric?: string;
  readonly images?: string[];
  readonly categoryId: string;
  readonly isActive?: boolean;
  readonly isFeatured?: boolean;
  readonly variants?: ProductVariantPayloadModel[];
}

export interface CategoryPayloadModel {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly image?: string;
  readonly sortOrder?: number;
  readonly isActive?: boolean;
}

export interface SaveCategoryModel {
  readonly id?: string;
  readonly payload: CategoryPayloadModel;
}

export interface SaveProductModel {
  readonly id?: string;
  readonly payload: ProductPayloadModel;
}
