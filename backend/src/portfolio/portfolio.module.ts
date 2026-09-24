import { Module } from '@nestjs/common';
import {
  AdminPortfolioController,
  PortfolioController,
} from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  controllers: [PortfolioController, AdminPortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
