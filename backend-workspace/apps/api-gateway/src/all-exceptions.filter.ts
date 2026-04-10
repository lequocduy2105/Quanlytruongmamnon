import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * RpcExceptionFilter — Bắt lỗi từ microservice TCP trả về dạng
 * { status: 'error', message: '...' } và convert thành HTTP 500 response đúng chuẩn.
 * Đồng thời log lỗi với stack trace đầy đủ để debug.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Lỗi từ microservice TCP dạng { status: 'error', message: '...' }
    if (
      exception &&
      typeof exception === 'object' &&
      'status' in exception &&
      (exception as any).status === 'error'
    ) {
      const msg = (exception as any).message || 'Microservice error';
      this.logger.error(
        `[Microservice Error] ${request.method} ${request.url} → ${msg}`,
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: msg,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Lỗi HTTP thông thường
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return response.status(status).json({
        statusCode: status,
        message: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Lỗi không xác định
    this.logger.error(
      `[Unknown Error] ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
