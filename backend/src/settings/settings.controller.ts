import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

/**
 * Public on purpose: the Contact and About pages show the shop details to
 * guests, and the checkout/order pages show the bank card and shipping rates
 * to signed-in customers. None of it is secret.
 */
@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  readonly #settings: SettingsService;

  constructor(settings: SettingsService) {
    this.#settings = settings;
  }

  @Get()
  get() {
    return this.#settings.get();
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  readonly #settings: SettingsService;

  constructor(settings: SettingsService) {
    this.#settings = settings;
  }

  @Get()
  get() {
    return this.#settings.get();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.#settings.update(dto);
  }
}
