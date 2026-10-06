import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  readonly #payment: PaymentService;

  constructor(payment: PaymentService) {
    this.#payment = payment;
  }

  /** Public: checkout asks which methods to offer before anyone signs in. */
  @Get('methods')
  methods() {
    return this.#payment.methods();
  }

  /**
   * Unauthenticated on purpose: the gateway redirects the customer's browser
   * here, and that navigation carries no bearer token. The authority in the
   * query plus server-side verification is what proves the payment.
   */
  @Get('callback')
  @Redirect()
  async callback(@Query() dto: PaymentCallbackDto) {
    return { url: await this.#payment.callback(dto) };
  }

  @Post(':orderId/start')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  start(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.#payment.start(userId, orderId);
  }
}
