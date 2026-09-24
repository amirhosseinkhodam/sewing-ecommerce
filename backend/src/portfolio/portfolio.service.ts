import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { PortfolioQueryDto } from './dto/portfolio-query.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

const PORTFOLIO_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PortfolioInclude;

@Injectable()
export class PortfolioService {
  readonly #prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.#prisma = prisma;
  }

  findAllPublic(query: PortfolioQueryDto) {
    return this.#paginate(query, this.#buildWhere(query, true));
  }

  findAllAdmin(query: PortfolioQueryDto) {
    return this.#paginate(query, this.#buildWhere(query, false));
  }

  async findBySlug(slug: string) {
    const item = await this.#prisma.portfolio.findFirst({
      where: { slug, isActive: true },
      include: PORTFOLIO_INCLUDE,
    });
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item;
  }

  async findById(id: string) {
    const item = await this.#prisma.portfolio.findUnique({
      where: { id },
      include: PORTFOLIO_INCLUDE,
    });
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item;
  }

  async create(dto: CreatePortfolioDto) {
    if (dto.categoryId) {
      await this.#ensureCategoryExists(dto.categoryId);
    }
    const slug = dto.slug?.trim() ? dto.slug : slugify(dto.title, 'portfolio');
    return this.#prisma.portfolio.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        images: dto.images ?? [],
        isActive: dto.isActive ?? true,
        ...(dto.categoryId
          ? { category: { connect: { id: dto.categoryId } } }
          : {}),
      },
      include: PORTFOLIO_INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePortfolioDto) {
    await this.findById(id);
    if (dto.categoryId) {
      await this.#ensureCategoryExists(dto.categoryId);
    }
    const slug = dto.slug?.trim()
      ? dto.slug
      : dto.title
        ? slugify(dto.title, 'portfolio')
        : undefined;

    return this.#prisma.portfolio.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(slug ? { slug } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        // An explicit null detaches the category; undefined leaves it alone.
        ...(dto.categoryId !== undefined
          ? {
              category: dto.categoryId
                ? { connect: { id: dto.categoryId } }
                : { disconnect: true },
            }
          : {}),
      },
      include: PORTFOLIO_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.#prisma.portfolio.delete({ where: { id } });
    return { deleted: true };
  }

  async #paginate(query: PortfolioQueryDto, where: Prisma.PortfolioWhereInput) {
    const [items, total] = await Promise.all([
      this.#prisma.portfolio.findMany({
        where,
        include: PORTFOLIO_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.#prisma.portfolio.count({ where }),
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
    query: PortfolioQueryDto,
    activeOnly: boolean,
  ): Prisma.PortfolioWhereInput {
    const where: Prisma.PortfolioWhereInput = activeOnly
      ? { isActive: true }
      : {};

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async #ensureCategoryExists(categoryId: string) {
    const category = await this.#prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }
}
