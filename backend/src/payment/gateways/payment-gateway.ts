import type {
  GatewayRequestModel,
  GatewayRequestResultModel,
  GatewayVerifyModel,
  GatewayVerifyResultModel,
} from '../models/gateway';

/**
 * One online payment provider. `PaymentService` only talks to this, so going
 * from the fake gateway to Zarinpal is a `PAYMENT_PROVIDER` change, not a code
 * change. Also the DI token `PaymentModule` binds the configured provider to.
 */
export abstract class PaymentGateway {
  abstract request(
    input: GatewayRequestModel,
  ): Promise<GatewayRequestResultModel>;

  abstract verify(input: GatewayVerifyModel): Promise<GatewayVerifyResultModel>;
}
