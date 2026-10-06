export interface GatewayRequestModel {
  readonly orderId: string;
  /** Order total in Toman, the unit the shop stores prices in. */
  readonly amount: number;
  readonly description: string;
  /** Absolute URL the gateway sends the browser back to. */
  readonly callbackUrl: string;
}

export interface GatewayRequestResultModel {
  /** The gateway's id for this payment attempt; the callback echoes it back. */
  readonly authority: string;
  /** Where to send the customer's browser to pay. */
  readonly redirectUrl: string;
}

export interface GatewayVerifyModel {
  readonly authority: string;
  /** Must equal the amount requested, so a tampered callback cannot pass. */
  readonly amount: number;
}

export type GatewayVerifyResultModel =
  { readonly ok: true; readonly refId: string } | { readonly ok: false };
