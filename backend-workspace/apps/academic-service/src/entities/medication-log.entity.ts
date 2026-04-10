import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type MedLogStatus = 'given' | 'refused' | 'missed';

@Entity('medication_logs')
export class MedicationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'schedule_id', type: 'int' })
  scheduleId: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId: number;

  @Column({
    name: 'administered_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  administeredAt: Date;

  @Column({ name: 'administered_by', type: 'int', nullable: true })
  administeredBy: number | null;

  @Column({
    type: 'enum',
    enum: ['given', 'refused', 'missed'],
    default: 'given',
  })
  status: MedLogStatus;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
