import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    console.error('❌ Unhandled exception:', exception);

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception.getResponse())
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private extractMessage(response: any): string | string[] {
    if (typeof response === 'string') return response;
    if (Array.isArray(response?.message)) return response.message;
    return response?.message || 'Unexpected error';
  }
}
