import { Injectable, NotFoundException } from '@nestjs/common';
import { SHIPPING_METHODS } from '../../../shared/const/shipping-methods';
import type { ShopSettingsModel } from '../../../shared/models/settings';
import { PrismaService } from '../common/prisma/prisma.service';
import type { ShopSetting } from '../generated/prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';

/**
 * The settings row is a singleton. The id is pinned rather than generated so
 * `findUnique` works and the admin form can never create a second row.
 */
const SETTINGS_ID = 'default';

@Injectable()
export class SettingsService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  /**
   * Read by anonymous visitors (contact details) and by signed-in customers
   * (bank card, shipping rates), so a missing row is a deployment problem
   * rather than something to paper over with silent defaults.
   */
  async get(): Promise<ShopSettingsModel> {
    const settings = await this.#prisma.shopSetting.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (!settings) {
      throw new NotFoundException('Shop settings not found');
    }
    return this.#toModel(settings);
  }

  async update(dto: UpdateSettingsDto): Promise<ShopSettingsModel> {
    const settings = await this.#prisma.shopSetting.upsert({
      where: { id: SETTINGS_ID },
      update: dto,
      create: { id: SETTINGS_ID, ...dto },
    });
    return this.#toModel(settings);
  }

  #toModel(settings: ShopSetting): ShopSettingsModel {
    return {
      shopName: settings.shopName,
      bankCardNumber: settings.bankCardNumber,
      bankCardHolder: settings.bankCardHolder,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      shopAddress: settings.shopAddress,
      businessHours: settings.businessHours,
      shippingRates: {
        [SHIPPING_METHODS.POST]: {
          price: String(settings.postPrice),
          etaDays: settings.postEtaDays,
        },
        [SHIPPING_METHODS.COURIER]: {
          price: String(settings.courierPrice),
          etaDays: settings.courierEtaDays,
        },
      },
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
