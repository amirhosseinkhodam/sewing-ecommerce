export interface CartItemModel {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly productName: string;
  readonly productSlug: string;
  readonly productImage: string | null;
  readonly size: string;
  readonly unitPrice: string;
  readonly stock: number;
}

export interface CartModel {
  readonly id: string;
  readonly items: CartItemModel[];
}

export interface AddCartItemPayloadModel {
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export interface UpdateCartItemPayloadModel {
  readonly quantity: number;
}
