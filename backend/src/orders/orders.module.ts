import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { UnpaidOrderSweeper } from './unpaid-order.sweeper';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [SettingsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, UnpaidOrderSweeper],
})
export class OrdersModule {}
