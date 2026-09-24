import { IsIn } from 'class-validator';
import { PaymentStatus } from '../../generated/prisma/client';

export class UpdatePaymentStatusDto {
  @IsIn(Object.values(PaymentStatus))
  readonly paymentStatus!: PaymentStatus;
}
