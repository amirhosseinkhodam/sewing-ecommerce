import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardStatsQueryDto } from './dto/dashboard-stats-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  readonly #dashboard: DashboardService;

  constructor(dashboard: DashboardService) {
    this.#dashboard = dashboard;
  }

  @Get('stats')
  getStats(@Query() query: DashboardStatsQueryDto) {
    return this.#dashboard.getStats(query);
  }
}
