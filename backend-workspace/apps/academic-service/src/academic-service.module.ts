import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AcademicServiceController } from './academic-service.controller';
import { AcademicServiceService } from './academic-service.service';
import { InvoiceCronService } from './invoice-cron.service';
import { Teacher } from './entities/teacher.entity';
import { Classroom } from './entities/classroom.entity';
import { Student } from './entities/student.entity';
import { SkillAssessment } from './entities/skill-assessment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Attendance } from './entities/attendance.entity';
import { AuthorizedPickup } from './entities/authorized-pickup.entity';
import { FeeConfig } from './entities/fee-config.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { InvoiceBatch } from './entities/invoice-batch.entity';
import { Notification } from './entities/notification.entity';
// MedicationSchedule, MedicationLog, IncidentReport → moved to health-service
import { LeaveRequest } from './entities/leave-request.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { DailyMenu } from './entities/daily-menu.entity';
import { LessonContent } from './entities/lesson-content.entity';

const ALL_ENTITIES = [
  Teacher,
  Classroom,
  Student,
  SkillAssessment,
  ActivityLog,
  Feedback,
  Attendance,
  AuthorizedPickup,
  FeeConfig,
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceBatch,
  Notification,
  // MedicationSchedule, MedicationLog, IncidentReport → health-service
  LeaveRequest,
  SupportTicket,
  DailyMenu,
  LessonContent,
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
          // Connection pool — tự động tái sử dụng và kiểm tra kết nối còn sống
          connectionLimit: 10,
          waitForConnections: true,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000, // 10s ping giữ kết nối sống
        },
        // Auto-reconnect: NestJS tự thử kết nối lại nếu DB bị sập
        retryAttempts: 10,
        retryDelay: 3000, // thử lại mỗi 3 giây
        // synchronize bật để tự động đồng bộ cấu trúc DB khi có thay đổi Entity
        synchronize: true,
        entities: ALL_ENTITIES,
        // Bật SQL logging chỉ khi DEBUG_SQL=true — tắt ở production để tránh log nhạy cảm
        logging: config.get('DEBUG_SQL', 'false') === 'true',
      }),
    }),

    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  controllers: [AcademicServiceController],
  providers: [AcademicServiceService, InvoiceCronService],
})
export class AcademicServiceModule {}
