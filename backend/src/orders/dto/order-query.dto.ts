import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../../generated/prisma/client';

export class OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly pageSize: number = 10;

  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  readonly status?: OrderStatus;

  @IsOptional()
  @IsIn(Object.values(PaymentStatus))
  readonly paymentStatus?: PaymentStatus;

  /** Admin only: matches customer name/phone or order id. */
  @IsOptional()
  @IsString()
  readonly search?: string;
}
