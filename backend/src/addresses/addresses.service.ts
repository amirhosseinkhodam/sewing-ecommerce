import { Injectable, NotFoundException } from '@nestjs/common';
import type { AddressModel } from '../../../shared/models/address';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const USER_ADDRESSES_ORDER = [
  { isDefault: 'desc' as const },
  { createdAt: 'desc' as const },
];

@Injectable()
export class AddressesService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async findAll(userId: string): Promise<AddressModel[]> {
    const addresses = await this.#prisma.address.findMany({
      where: { userId },
      orderBy: USER_ADDRESSES_ORDER,
    });
    return addresses.map((address) => this.#toModel(address));
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressModel> {
    const count = await this.#prisma.address.count({ where: { userId } });
    const makeDefault = dto.isDefault === true || count === 0;

    const address = await this.#prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          ...dto,
          userId,
          isDefault: makeDefault,
        },
      });
    });
    return this.#toModel(address);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressModel> {
    await this.#findOwned(userId, id);

    const address = await this.#prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data: { ...dto } });
    });
    return this.#toModel(address);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    await this.#findOwned(userId, id);
    await this.#prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  #toModel(address: {
    id: string;
    label: string;
    province: string;
    city: string;
    fullAddress: string;
    postalCode: string | null;
    phone: string;
    isDefault: boolean;
  }): AddressModel {
    return {
      id: address.id,
      label: address.label,
      province: address.province,
      city: address.city,
      fullAddress: address.fullAddress,
      postalCode: address.postalCode ?? undefined,
      phone: address.phone,
      isDefault: address.isDefault,
    };
  }

  async #findOwned(userId: string, id: string) {
    const address = await this.#prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }
}
