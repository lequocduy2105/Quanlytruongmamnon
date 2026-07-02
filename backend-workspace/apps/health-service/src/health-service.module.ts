import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthServiceController } from './health-service.controller';
import { HealthServiceService } from './health-service.service';
import { HealthRecord } from './entities/health-record.entity';
import { MedicationSchedule } from './entities/medication-schedule.entity';
import { MedicationLog } from './entities/medication-log.entity';
import { IncidentReport } from './entities/incident-report.entity';

const HEALTH_ENTITIES = [
  HealthRecord,
  MedicationSchedule,
  MedicationLog,
  IncidentReport,
];

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
        charset: 'utf8mb4',
        // Fix encoding tiếng Việt: buộc mysql2 driver dùng UTF8MB4 ở tầng kết nối TCP
        extra: {
          charset: 'UTF8MB4',
          connectionLimit: 10,
          waitForConnections: true,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
        },
        retryAttempts: 10,
        retryDelay: 3000,
        // synchronize: true — tự động đồng bộ cấu trúc DB
        synchronize: true,
        entities: HEALTH_ENTITIES,
        logging: false,
      }),
    }),

    TypeOrmModule.forFeature(HEALTH_ENTITIES),
  ],
  controllers: [HealthServiceController],
  providers: [HealthServiceService],
})
export class HealthServiceModule {}
