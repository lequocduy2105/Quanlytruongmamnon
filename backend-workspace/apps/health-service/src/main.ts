import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { HealthServiceModule } from './health-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    HealthServiceModule,
    {
      transport: Transport.TCP,
      options: { port: 3003 },
    },
  );
  await app.listen();
}
bootstrap();
