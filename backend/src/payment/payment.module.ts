import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { PAYMENT_PROVIDERS } from '../../../shared/const/payment-providers';
import { FakeGatewayController } from './fake-gateway.controller';
import { FakePaymentGateway } from './gateways/fake';
import { PaymentGateway } from './gateways/payment-gateway';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

/**
 * Binds `PaymentGateway` to the provider named by `PAYMENT_PROVIDER`. Unset
 * means no online payment at all: checkout offers card-to-card only.
 * Read from `process.env` because the choice decides which controllers and
 * providers exist, before `ConfigService` is available — `register()` must
 * stay after `ConfigModule.forRoot()` in `AppModule`, which loads `.env`.
 * Global so `OrdersService` can refuse `ONLINE` orders when it is off.
 */
@Module({})
export class PaymentModule {
  static register(): DynamicModule {
    const provider = process.env.PAYMENT_PROVIDER?.toUpperCase();
    const controllers: Type[] = [PaymentController];
    const providers: Provider[] = [PaymentService];

    if (provider === PAYMENT_PROVIDERS.FAKE) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'PAYMENT_PROVIDER=FAKE marks orders paid without real money; refusing under NODE_ENV=production',
        );
      }
      controllers.push(FakeGatewayController);
      providers.push(FakePaymentGateway, {
        provide: PaymentGateway,
        useExisting: FakePaymentGateway,
      });
    } else if (provider) {
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
    }

    return {
      module: PaymentModule,
      global: true,
      controllers,
      providers,
      exports: [PaymentService],
    };
  }
}
