import { Module } from '@nestjs/common';
import {
  AdminMessagesController,
  ContactController,
} from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  controllers: [ContactController, AdminMessagesController],
  providers: [ContactService],
})
export class ContactModule {}
