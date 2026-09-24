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
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { MessageQueryDto } from './dto/message-query.dto';

/** Public: guests submit the contact form without an account. */
@ApiTags('contact')
@Controller('contact')
export class ContactController {
  readonly #contact: ContactService;

  constructor(contact: ContactService) {
    this.#contact = contact;
  }

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.#contact.create(dto);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/messages')
export class AdminMessagesController {
  readonly #contact: ContactService;

  constructor(contact: ContactService) {
    this.#contact = contact;
  }

  @Get()
  findAll(@Query() query: MessageQueryDto) {
    return this.#contact.findAll(query);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.#contact.markRead(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.#contact.remove(id);
  }
}
