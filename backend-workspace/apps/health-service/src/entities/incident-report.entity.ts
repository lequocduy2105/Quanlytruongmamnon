import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type IncidentType = 'INJURY' | 'ILLNESS' | 'BEHAVIOR' | 'OTHER';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

/**
 * Biên bản sự cố y tế / hành vi trong trường mầm non.
 *
 * NOTE: Không dùng @ManyToOne tới Student/Teacher vì các entity đó
 * thuộc academic-service. Cross-service entity relations không an toàn
 * trong Microservices. Dùng scalar studentId / teacherId thay thế.
 */
@Entity('incident_reports')
export class IncidentReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'teacher_id', type: 'int' })
  teacherId!: number;

  @Column({
    name: 'incident_type',
    type: 'enum',
    enum: ['INJURY', 'ILLNESS', 'BEHAVIOR', 'OTHER'],
    default: 'OTHER',
  })
  incidentType!: IncidentType;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'LOW',
  })
  severity!: IncidentSeverity;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'first_aid_taken', type: 'text', nullable: true })
  firstAidTaken!: string | null;

  @Column({
    name: 'attachment_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  attachmentUrl!: string | null;

  @Column({
    name: 'parent_acknowledged_at',
    type: 'datetime',
    nullable: true,
  })
  parentAcknowledgedAt!: Date | null;

  @Column({
    name: 'principal_reviewed_at',
    type: 'datetime',
    nullable: true,
  })
  principalReviewedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
