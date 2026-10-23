import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

const UNIQUE_VIOLATION = 'P2002';

/**
 * Category, product and portfolio slugs are unique. A clash is the admin's
 * input error, so it surfaces as a 409 instead of a bare 500. `meta` differs
 * between Prisma query engines and driver adapters, so match on its text.
 */
function isSlugConflict(exception: unknown): boolean {
  return (
    exception instanceof Prisma.PrismaClientKnownRequestError &&
    exception.code === UNIQUE_VIOLATION &&
    JSON.stringify(exception.meta ?? {}).includes('slug')
  );
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (isSlugConflict(exception)) {
      status = HttpStatus.CONFLICT;
      message = 'Slug already in use';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        const raw = body.message;
        if (typeof raw === 'string') {
          message = raw;
        } else if (Array.isArray(raw)) {
          message = raw.join(', ');
        } else if (raw === undefined && typeof body.error === 'string') {
          message = body.error;
        }
      }
    }

    response.status(status).json({ statusCode: status, message });
  }
}
