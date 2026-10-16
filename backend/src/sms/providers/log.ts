import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider';

/** Free stand-in: writes the message to the application log instead of sending it. */
@Injectable()
export class LogSmsProvider extends SmsProvider {
  readonly #logger = new Logger('SMS');

  send(phone: string, message: string): Promise<void> {
    this.#logger.log(`to ${phone}: ${message}`);
    return Promise.resolve();
  }
}
