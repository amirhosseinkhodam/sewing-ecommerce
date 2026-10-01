import { Module } from '@nestjs/common';
import {
  AdminSettingsController,
  SettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
  // Exported so OrdersService can charge the configured shipping rate when it
  // places an order.
  exports: [SettingsService],
})
export class SettingsModule {}
