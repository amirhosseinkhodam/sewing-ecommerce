import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod, ShippingMethod } from '../../generated/prisma/client';

export class CreateOrderDto {
  @IsEnum(ShippingMethod)
  readonly shippingMethod: ShippingMethod;

  @IsUUID()
  readonly shippingAddressId: string;

  @IsEnum(PaymentMethod)
  readonly paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}
