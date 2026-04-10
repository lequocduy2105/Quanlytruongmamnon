import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Classroom } from './classroom.entity';

/**
 * Teacher entity - thuộc academic-service.
 * user_id là foreign key tham chiếu tới bảng users (quản lý bởi auth-service).
 * Trong Microservices, KHÔNG dùng TypeORM @OneToOne cross-service.
 * Mọi join phải thực hiện ở tầng service logic, không ở TypeORM.
 *
 * class_id: lớp mà giáo viên này phụ trách chính.
 * Đây là quan hệ cơ sở để xác định lớp khi GV đăng nhập,
 * thay thế cho heuristic dựa vào alerts.
 */
@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number;

  @Column({ type: 'varchar' })
  full_name!: string;

  @Column({ type: 'varchar' })
  specializations!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  /**
   * Lớp học giáo viên này phụ trách chính.
   * NULL = giáo viên hỗ trợ / chưa phân lớp.
   */
  @Column({ name: 'class_id', type: 'int', nullable: true })
  classId!: number | null;

  @ManyToOne(() => Classroom, { nullable: true, eager: false })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom | null;
}
