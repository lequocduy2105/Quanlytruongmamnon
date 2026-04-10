import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicServiceController } from './academic-service.controller';
import { AcademicServiceService } from './academic-service.service';
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
import { Payment } from './entities/payment.entity';
import { Notification } from './entities/notification.entity';
import { MedicationSchedule } from './entities/medication-schedule.entity';
import { MedicationLog } from './entities/medication-log.entity';
import { IncidentReport } from './entities/incident-report.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { DailyMenu } from './entities/daily-menu.entity';

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
  Payment,
  Notification,
  MedicationSchedule,
  MedicationLog,
  IncidentReport,
  LeaveRequest,
  SupportTicket,
  DailyMenu,
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
        // synchronize tắt để tránh lỗi typeorm_metadata — schema đã được tạo qua seed script
        synchronize: false,
        entities: ALL_ENTITIES,
        logging: true,  // bật full logging tạm để debug SQL lỗi
      }),
    }),

    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  controllers: [AcademicServiceController],
  providers: [AcademicServiceService],
})
export class AcademicServiceModule {}
