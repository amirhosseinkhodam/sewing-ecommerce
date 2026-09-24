import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client';

export class UpdateOrderStatusDto {
  @IsIn(Object.values(OrderStatus))
  readonly status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly trackingCode?: string;
}
