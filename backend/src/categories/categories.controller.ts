import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  readonly #categories: CategoriesService;

  constructor(categories: CategoriesService) {
    this.#categories = categories;
  }

  @Get()
  findAll() {
    return this.#categories.findActive();
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  readonly #categories: CategoriesService;

  constructor(categories: CategoriesService) {
    this.#categories = categories;
  }

  @Get()
  findAll() {
    return this.#categories.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.#categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.#categories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.#categories.remove(id);
  }
}
