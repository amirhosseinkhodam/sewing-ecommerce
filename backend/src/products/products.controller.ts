import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  readonly #products: ProductsService;

  constructor(products: ProductsService) {
    this.#products = products;
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.#products.findAllPublic(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.#products.findBySlug(slug);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  readonly #products: ProductsService;

  constructor(products: ProductsService) {
    this.#products = products;
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.#products.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.#products.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.#products.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.#products.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.#products.remove(id);
  }
}
