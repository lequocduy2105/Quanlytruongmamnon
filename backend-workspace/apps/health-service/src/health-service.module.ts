import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthServiceController } from './health-service.controller';
import { HealthServiceService } from './health-service.service';
import { HealthRecord } from './entities/health-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'kindergarten_db'),
        synchronize: process.env.NODE_ENV !== 'production',
        entities: [HealthRecord],
        logging: false,
      }),
    }),

    TypeOrmModule.forFeature([HealthRecord]),
  ],
  controllers: [HealthServiceController],
  providers: [HealthServiceService],
})
export class HealthServiceModule {}
