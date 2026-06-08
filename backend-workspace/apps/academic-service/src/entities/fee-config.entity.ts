import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Classroom } from './classroom.entity';

export type FeeType =
  | 'tuition'
  | 'meal'
  | 'facility'
  | 'transport'
  | 'extracurricular'
  | 'other';

export type BillingCycle = 'monthly' | 'daily' | 'one_time';

@Entity('fee_configs')
export class FeeConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'class_id', type: 'int', nullable: true })
  classId!: number | null;

  @ManyToOne(() => Classroom, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom | null;

  @Column({
    name: 'grade_level',
    type: 'enum',
    enum: ['MAM', 'CHOI', 'LA'],
    nullable: true,
  })
  gradeLevel!: 'MAM' | 'CHOI' | 'LA' | null;

  @Column({
    name: 'fee_type',
    type: 'enum',
    enum: ['tuition', 'meal', 'facility', 'transport', 'extracurricular', 'other'],
    default: 'tuition',
  })
  feeType!: FeeType;

  @Column({ name: 'name', length: 150 })
  name!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value || 0),
    },
  })
  amount!: number;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: ['monthly', 'daily', 'one_time'],
    default: 'monthly',
  })
  billingCycle!: BillingCycle;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil!: string | null;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
