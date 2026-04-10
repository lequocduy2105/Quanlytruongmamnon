import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Student } from './student.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT_EXCUSED = 'absent_excused',
  ABSENT_UNEXCUSED = 'absent_unexcused',
  LATE = 'late',
}

@Entity('attendance')
@Unique(['studentId', 'date'])
@Index(['date'])
@Index(['studentId'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id' })
  studentId!: number;

  @ManyToOne(() => Student, { nullable: false, eager: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  /** Ngày điểm danh — DATE (YYYY-MM-DD) */
  @Column({ type: 'date' })
  date!: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  /** Ghi chú lý do vắng / trễ (tuỳ chọn) */
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** user_id của teacher đã ghi điểm danh */
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
