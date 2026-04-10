import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Feedback entity — lưu đánh giá từ phụ huynh (star rating + comment).
 * parent_user_id: userId của phụ huynh submit (từ JWT).
 * teacher_id: giáo viên được đánh giá (nếu có).
 */
@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'parent_user_id', type: 'int', nullable: true })
  parentUserId: number;

  @Column({ name: 'teacher_id', type: 'int', nullable: true })
  teacherId: number;

  @Column({ name: 'student_id', type: 'int', nullable: true })
  studentId: number;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}
