import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MedFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times'
  | 'as_needed';

@Entity('medication_schedules')
export class MedicationSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'medication_name', type: 'varchar', length: 200 })
  medicationName!: string;

  @Column({ type: 'varchar', length: 100 })
  dosage!: string;

  @Column({
    type: 'enum',
    enum: ['once_daily', 'twice_daily', 'three_times', 'as_needed'],
    default: 'once_daily',
  })
  frequency!: MedFrequency;

  @Column({ name: 'time_morning', type: 'time', nullable: true })
  timeMorning!: string | null;

  @Column({ name: 'time_noon', type: 'time', nullable: true })
  timeNoon!: string | null;

  @Column({ name: 'time_afternoon', type: 'time', nullable: true })
  timeAfternoon!: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'prescription_note', type: 'text', nullable: true })
  prescriptionNote!: string | null;

  @Column({ name: 'prescription_url', type: 'varchar', length: 500, nullable: true })
  prescriptionUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
