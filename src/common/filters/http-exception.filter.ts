import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelationId>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as string | { message: string | string[] };

    // Extract correlationId from request
    const correlationId = request.correlationId || 'N/A';

    // Extract error details
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      message:
        typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse.message || exception.message,
      errors:
        typeof exceptionResponse === 'object' && Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : undefined,
    };

    // Log error for debugging (silence common non-critical 404s)
    const isFavicon = request.url.toLowerCase().includes('favicon.ico');
    if (!(status === 404 && isFavicon)) {
      this.logger.error(`[${correlationId}] ${request.method} ${request.url} - Status: ${status}`, exception.stack);
    }

    // Remove undefined fields from response
    Object.keys(errorResponse).forEach(
      (key) =>
        errorResponse[key as keyof typeof errorResponse] === undefined &&
        delete errorResponse[key as keyof typeof errorResponse],
    );

    response.status(status).json(errorResponse);
  }
}
