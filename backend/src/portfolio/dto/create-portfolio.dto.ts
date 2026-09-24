import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly slug?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  /** Upload paths from `POST /api/upload/multiple`, e.g. `/uploads/x.jpg`. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly images?: string[];

  @IsOptional()
  @IsUUID()
  readonly categoryId?: string;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
