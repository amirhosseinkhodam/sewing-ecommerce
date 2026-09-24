import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  readonly #orders: OrdersService;

  constructor(orders: OrdersService) {
    this.#orders = orders;
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: OrderQueryDto) {
    return this.#orders.findAllForUser(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.#orders.findOneForUser(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.#orders.create(userId, dto);
  }

  @Patch(':id/receipt')
  uploadReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UploadReceiptDto,
  ) {
    return this.#orders.uploadReceipt(userId, id, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.#orders.cancelOwn(userId, id);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  readonly #orders: OrdersService;

  constructor(orders: OrdersService) {
    this.#orders = orders;
  }

  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.#orders.findAllForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.#orders.findOneForAdmin(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.#orders.updateStatus(id, dto);
  }

  @Patch(':id/payment')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.#orders.updatePaymentStatus(id, dto);
  }
}
