import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // parent user_id (từ bảng users) — không FK để tránh circular dependency
  @Column({ name: 'requested_by', type: 'int' })
  requestedBy: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: LeaveStatus;

  /**
   * Đủ điều kiện hoàn tiền ăn nếu:
   * - Ngày báo nghỉ trước 17:00 của ngày trước ngày bắt đầu nghỉ
   * - Hoặc ngày bắt đầu nghỉ > hôm nay
   * Logic này được tính khi tạo đơn, không cần tính lại khi duyệt.
   */
  @Column({ name: 'is_meal_refund_eligible', type: 'boolean', default: false })
  isMealRefundEligible: boolean;

  /**
   * Số ngày bữa ăn cần trừ (tính sau khi duyệt, loại trừ cuối tuần)
   */
  @Column({ name: 'meals_to_deduct', type: 'int', default: 0 })
  mealsToDeduct: number;

  /**
   * Số tiền ăn sẽ được hoàn / credit vào hóa đơn kỳ tiếp
   */
  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  refundAmount: number;

  // admin/BGH user_id duyệt
  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
