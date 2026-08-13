import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  async findAllPublic(query: ProductQueryDto) {
    const where = this.#buildWhere(query, true);
    return this.#paginate(query, where);
  }

  async findAllAdmin(query: ProductQueryDto) {
    const where = this.#buildWhere(query, false);
    return this.#paginate(query, where);
  }

  async findBySlug(slug: string) {
    const product = await this.#prisma.product.findFirst({
      where: { slug, isActive: true },
      include: this.#detailInclude,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findById(id: string) {
    const product = await this.#prisma.product.findUnique({
      where: { id },
      include: this.#detailInclude,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.#ensureCategoryExists(dto.categoryId);
    const slug = dto.slug?.trim() ? dto.slug : slugify(dto.name, 'product');
    const data: Prisma.ProductCreateInput = {
      name: dto.name,
      slug,
      description: dto.description,
      price: new Prisma.Decimal(dto.price),
      fabric: dto.fabric,
      images: dto.images ?? [],
      category: { connect: { id: dto.categoryId } },
      isActive: dto.isActive,
      isFeatured: dto.isFeatured,
      ...(dto.variants && dto.variants.length > 0
        ? { variants: { create: this.#variantCreateInputs(dto.variants) } }
        : {}),
    };
    return this.#prisma.product.create({
      data,
      include: this.#detailInclude,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    if (dto.categoryId) {
      await this.#ensureCategoryExists(dto.categoryId);
    }
    const slug = dto.slug?.trim()
      ? dto.slug
      : dto.name
        ? slugify(dto.name, 'product')
        : undefined;
    const data: Prisma.ProductUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(slug ? { slug } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.price !== undefined
        ? { price: new Prisma.Decimal(dto.price) }
        : {}),
      ...(dto.fabric !== undefined ? { fabric: dto.fabric } : {}),
      ...(dto.images !== undefined ? { images: dto.images } : {}),
      ...(dto.categoryId !== undefined
        ? { category: { connect: { id: dto.categoryId } } }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.variants !== undefined
        ? {
            variants: {
              deleteMany: {},
              create: this.#variantCreateInputs(dto.variants),
            },
          }
        : {}),
    };
    return this.#prisma.product.update({
      where: { id },
      data,
      include: this.#detailInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.#prisma.productVariant.deleteMany({ where: { productId: id } });
    await this.#prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  readonly #detailInclude = {
    category: true,
    variants: { orderBy: { size: 'asc' } },
  } satisfies Prisma.ProductInclude;

  #variantCreateInputs(
    variants: { size: string; stock: number; price?: number }[],
  ): Prisma.ProductVariantCreateWithoutProductInput[] {
    return variants.map((variant) => ({
      size: variant.size,
      stock: variant.stock,
      ...(variant.price !== undefined
        ? { price: new Prisma.Decimal(variant.price) }
        : {}),
    }));
  }

  async #ensureCategoryExists(categoryId: string) {
    const category = await this.#prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }

  async #paginate(query: ProductQueryDto, where: Prisma.ProductWhereInput) {
    const [items, total] = await Promise.all([
      this.#prisma.product.findMany({
        where,
        include: this.#detailInclude,
        orderBy: this.#buildOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.product.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  #buildWhere(
    query: ProductQueryDto,
    activeOnly: boolean,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = activeOnly
      ? { isActive: true }
      : {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    return where;
  }

  #buildOrderBy(
    sort: ProductSort | undefined,
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'priceAsc':
        return [{ price: 'asc' }, { createdAt: 'desc' }];
      case 'priceDesc':
        return [{ price: 'desc' }, { createdAt: 'desc' }];
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
