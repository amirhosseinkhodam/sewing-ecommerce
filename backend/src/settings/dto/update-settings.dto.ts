import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Prices travel as digit strings and become Prisma `Decimal` on write. */
const toAmount = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value.trim())
    ? Number(value)
    : value;

/**
 * Every field is required. The settings form always sends the whole row, so a
 * partial update would leave a second "unset" state to reason about.
 */
export class UpdateSettingsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  readonly shopName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  readonly bankCardNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  readonly bankCardHolder!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  readonly shopPhone!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  readonly shopEmail!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(400)
  readonly shopAddress!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly businessHours!: string;

  @Transform(toAmount)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly postPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly postEtaDays!: number;

  @Transform(toAmount)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  readonly courierPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly courierEtaDays!: number;
}
