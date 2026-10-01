import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CustomersService } from './customers.service';
import { CustomerQueryDto } from './dto/customer-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/customers')
export class AdminCustomersController {
  readonly #customers: CustomersService;

  constructor(customers: CustomersService) {
    this.#customers = customers;
  }

  @Get()
  findAll(@Query() query: CustomerQueryDto) {
    return this.#customers.findAll(query);
  }
}
