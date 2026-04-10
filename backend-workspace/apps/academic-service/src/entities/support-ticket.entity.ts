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

export type TicketCategory =
  | 'ACADEMIC'
  | 'FINANCE'
  | 'NUTRITION'
  | 'FACILITY'
  | 'TEACHER'
  | 'OTHER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id: number;

  // parent user_id — không FK để tránh phụ thuộc bảng users
  @Column({ name: 'parent_id', type: 'int' })
  parentId: number;

  @Column({ name: 'student_id', type: 'int', nullable: true })
  studentId: number | null;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student: Student | null;

  @Column({
    type: 'enum',
    enum: ['ACADEMIC', 'FINANCE', 'NUTRITION', 'FACILITY', 'TEACHER', 'OTHER'],
    default: 'OTHER',
  })
  category: TicketCategory;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'attachment_url', type: 'varchar', length: 500, nullable: true })
  attachmentUrl: string | null;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
  })
  status: TicketStatus;

  // admin user_id phụ trách xử lý
  @Column({ name: 'assigned_to', type: 'int', nullable: true })
  assignedTo: number | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  /**
   * Phụ huynh đánh giá chất lượng xử lý (1-5 sao) sau khi RESOLVED
   */
  @Column({ name: 'parent_rating', type: 'int', nullable: true })
  parentRating: number | null;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
