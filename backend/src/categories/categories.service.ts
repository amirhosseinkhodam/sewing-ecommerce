import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  findActive() {
    return this.#prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAll() {
    return this.#prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.#prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug?.trim() ? dto.slug : slugify(dto.name, 'category');
    const data: Prisma.CategoryCreateInput = {
      ...dto,
      slug,
    };
    return this.#prisma.category.create({ data });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const slug = dto.slug?.trim()
      ? dto.slug
      : dto.name
        ? slugify(dto.name, 'category')
        : undefined;
    const data: Prisma.CategoryUpdateInput = {
      ...dto,
      ...(slug ? { slug } : {}),
    };
    return this.#prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    const productCount = await this.#prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new ConflictException(
        'Cannot delete a category that still has products',
      );
    }
    await this.#prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
