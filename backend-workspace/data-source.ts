import { DataSource } from 'typeorm';

// Import all entities
import { User } from './apps/auth-service/src/entities/user.entity';
import { Teacher } from './apps/academic-service/src/entities/teacher.entity';
import { Classroom } from './apps/academic-service/src/entities/classroom.entity';
import { Student } from './apps/academic-service/src/entities/student.entity';
import { SkillAssessment } from './apps/academic-service/src/entities/skill-assessment.entity';
import { HealthRecord } from './apps/health-service/src/entities/health-record.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '', // Assuming root with no password for local setup
  database: 'kindergarten_db',
  synchronize: false, // We'll use migrations instead of synchronize
  logging: true,
  entities: [User, Teacher, Classroom, Student, SkillAssessment, HealthRecord],
  migrations: ['./migrations/*.ts'],
  subscribers: [],
});
