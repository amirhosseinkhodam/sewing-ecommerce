import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class ContactService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  /**
   * Public submission. Returns only an acknowledgement — the stored row is
   * admin-facing and must not echo back to an anonymous caller.
   */
  async create(dto: CreateContactDto): Promise<{ submitted: boolean }> {
    await this.#prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
      },
    });
    return { submitted: true };
  }

  async findAll(query: MessageQueryDto) {
    const where: Prisma.ContactMessageWhereInput = {};
    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.#prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.contactMessage.count({ where }),
      this.#prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async markRead(id: string) {
    await this.#findOne(id);
    return this.#prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    await this.#findOne(id);
    await this.#prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }

  async #findOne(id: string) {
    const message = await this.#prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }
}
