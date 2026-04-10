import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type FeeType = 'tuition' | 'meal' | 'other';
export type BillingCycle = 'monthly' | 'daily';

@Entity('fee_configs')
export class FeeConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'class_id', type: 'int', nullable: true })
  classId: number | null;

  @Column({
    name: 'fee_type',
    type: 'enum',
    enum: ['tuition', 'meal', 'other'],
    default: 'tuition',
  })
  feeType: FeeType;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  amount: number;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: ['monthly', 'daily'],
    default: 'monthly',
  })
  billingCycle: BillingCycle;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: string;

  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil: string | null;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
