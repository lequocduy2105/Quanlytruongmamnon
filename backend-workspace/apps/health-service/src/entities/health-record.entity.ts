import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * HealthRecord entity - thuộc health-service.
 * student_id là foreign key tới bảng students (academic-service).
 * KHÔNG import Student entity cross-service trong Microservices.
 * Dùng plain column thay vì TypeORM relation.
 */
@Entity('health_records')
export class HealthRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  height: number;

  @Column({ type: 'int' })
  heart_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  bmi_value: number;

  @Column('text', { nullable: true })
  doctor_note: string;

  @CreateDateColumn()
  logged_at: Date;
}
