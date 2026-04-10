import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';
import { AllExceptionsFilter } from './all-exceptions.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // Global exception filter — log URL + lỗi microservice chi tiết
  app.useGlobalFilters(new AllExceptionsFilter());

  // CODE-02: Validation pipe toàn cục — reject invalid DTOs trước khi vào controller
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip các fields không khai báo trong DTO
      forbidNonWhitelisted: false, // Log nhưng không throw error (tương thích backward)
      transform: true, // Tự động transform sang kiểu DTO đã khai báo
      transformOptions: {
        enableImplicitConversion: true, // Chuyển đổi string query params thành number
      },
    }),
  );

  // Restrict CORS to only the frontend dev origin
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  logger.log(`[API Gateway] Running on http://localhost:${port}`);
  logger.log(
    `[API Gateway] CORS allowed: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
  );
}

bootstrap();
