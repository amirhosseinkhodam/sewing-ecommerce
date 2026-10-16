import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LogSmsProvider } from './providers/log';
import { SmsProvider } from './providers/sms-provider';
import { SmsService } from './sms.service';

/**
 * Binds `SmsProvider` to the provider named by `SMS_PROVIDER` (`log` writes to
 * the application log). Unset means no SMS at all. Global so order and
 * payment code can notify without importing it.
 */
@Module({})
export class SmsModule {
  static register(): DynamicModule {
    const provider = process.env.SMS_PROVIDER?.toUpperCase();
    const providers: Provider[] = [SmsService];

    if (provider === 'LOG') {
      providers.push(LogSmsProvider, {
        provide: SmsProvider,
        useExisting: LogSmsProvider,
      });
    } else if (provider) {
      throw new Error(`Unknown SMS_PROVIDER: ${provider}`);
    }

    return {
      module: SmsModule,
      global: true,
      providers,
      exports: [SmsService],
    };
  }
}
