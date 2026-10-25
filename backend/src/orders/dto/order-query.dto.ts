import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrderStatus, PaymentStatus } from '../../generated/prisma/client';

export class OrderQueryDto extends PaginationQueryDto {
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
