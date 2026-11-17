import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as any;
        message = respObj.message || exception.message;
        errors = respObj.errors;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception?.code === 'P2002') {
      // Prisma Unique constraint violation
      status = HttpStatus.CONFLICT;
      const target = (exception.meta?.target as string[])?.join(', ') || 'field';
      message = `A record with this ${target} already exists.`;
    } else if (exception?.code === 'P2025') {
      // Prisma Record not found
      status = HttpStatus.NOT_FOUND;
      message = 'Requested record was not found.';
    } else {
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}:`,
        exception?.stack || exception,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}
