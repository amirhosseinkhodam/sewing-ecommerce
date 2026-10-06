import { IsIn, IsString, MaxLength } from 'class-validator';
import {
  CALLBACK_STATUSES,
  type CallbackStatus,
} from '../const/callback-statuses';

/** Query string a gateway appends when it sends the browser back. */
export class PaymentCallbackDto {
  /** PascalCase because that is what the gateway sends (Zarinpal's names). */
  @IsString()
  @MaxLength(100)
  readonly Authority!: string;

  @IsIn(Object.values(CALLBACK_STATUSES))
  readonly Status!: CallbackStatus;
}
