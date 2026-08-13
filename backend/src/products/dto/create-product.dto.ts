import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  readonly size: string;

  @IsInt()
  @Min(0)
  readonly stock: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly price?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly slug?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsNumber()
  @IsPositive()
  readonly price: number;

  @IsOptional()
  @IsString()
  readonly fabric?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly images?: string[];

  @IsUUID()
  readonly categoryId: string;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  readonly variants?: CreateVariantDto[];
}
