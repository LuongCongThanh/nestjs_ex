import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error details
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      errors:
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).message &&
        Array.isArray((exceptionResponse as any).message)
          ? (exceptionResponse as any).message
          : undefined,
    };

    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status}`,
      exception.stack,
    );

    // Remove undefined fields from response
    Object.keys(errorResponse).forEach(
      (key) =>
        errorResponse[key as keyof typeof errorResponse] === undefined &&
        delete errorResponse[key as keyof typeof errorResponse],
    );

    response.status(status).json(errorResponse);
  }
}
