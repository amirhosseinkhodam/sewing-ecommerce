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
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { PortfolioQueryDto } from './dto/portfolio-query.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  readonly #portfolio: PortfolioService;

  constructor(portfolio: PortfolioService) {
    this.#portfolio = portfolio;
  }

  @Get()
  findAll(@Query() query: PortfolioQueryDto) {
    return this.#portfolio.findAllPublic(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.#portfolio.findBySlug(slug);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/portfolio')
export class AdminPortfolioController {
  readonly #portfolio: PortfolioService;

  constructor(portfolio: PortfolioService) {
    this.#portfolio = portfolio;
  }

  @Get()
  findAll(@Query() query: PortfolioQueryDto) {
    return this.#portfolio.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.#portfolio.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePortfolioDto) {
    return this.#portfolio.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.#portfolio.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.#portfolio.remove(id);
  }
}
