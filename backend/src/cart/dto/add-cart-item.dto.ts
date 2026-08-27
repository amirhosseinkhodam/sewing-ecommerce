import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  readonly productId: string;

  @IsUUID()
  readonly variantId: string;

  @IsInt()
  @Min(1)
  readonly quantity: number;
}
