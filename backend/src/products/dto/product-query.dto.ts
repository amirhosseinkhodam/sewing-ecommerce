import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const PRODUCT_SORTS = ['newest', 'priceAsc', 'priceDesc'] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductQueryDto extends PaginationQueryDto {
  override readonly pageSize: number = 12;

  @IsOptional()
  @IsString()
  readonly search?: string;

  @IsOptional()
  @IsString()
  readonly category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly maxPrice?: number;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  readonly sort?: ProductSort;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  readonly isFeatured?: boolean;
}
