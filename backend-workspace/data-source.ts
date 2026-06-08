import { DataSource } from 'typeorm';

// Import all entities
import { User } from './apps/auth-service/src/entities/user.entity';
import { Teacher } from './apps/academic-service/src/entities/teacher.entity';
import { Classroom } from './apps/academic-service/src/entities/classroom.entity';
import { Student } from './apps/academic-service/src/entities/student.entity';
import { SkillAssessment } from './apps/academic-service/src/entities/skill-assessment.entity';
import { HealthRecord } from './apps/health-service/src/entities/health-record.entity';
import { FeeConfig } from './apps/academic-service/src/entities/fee-config.entity';
import { Invoice } from './apps/academic-service/src/entities/invoice.entity';
import { InvoiceItem } from './apps/academic-service/src/entities/invoice-item.entity';
import { Payment } from './apps/academic-service/src/entities/payment.entity';
import { InvoiceBatch } from './apps/academic-service/src/entities/invoice-batch.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456', // Matching environment
  database: 'kindergarten_db',
  synchronize: false, // We'll use migrations instead of synchronize
  logging: true,
  entities: [
    User,
    Teacher,
    Classroom,
    Student,
    SkillAssessment,
    HealthRecord,
    FeeConfig,
    Invoice,
    InvoiceItem,
    Payment,
    InvoiceBatch,
  ],
  migrations: ['./migrations/*.ts'],
  subscribers: [],
});
