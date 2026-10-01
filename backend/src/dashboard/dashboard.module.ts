import { Module } from '@nestjs/common';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [AdminDashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
