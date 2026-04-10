import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AcademicServiceModule } from './academic-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AcademicServiceModule,
    {
      transport: Transport.TCP,
      options: { port: 3002 },
    },
  );
  await app.listen();
}
bootstrap();
