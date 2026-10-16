/**
 * One SMS provider. `SmsService` only talks to this, so a paid provider can be
 * added later by implementing it and registering it in `SmsModule`.
 */
export abstract class SmsProvider {
  abstract send(phone: string, message: string): Promise<void>;
}
