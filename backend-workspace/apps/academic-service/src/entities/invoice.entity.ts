import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InvoiceStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'month', type: 'char', length: 7 })
  month!: string; // YYYY-MM

  @Column({
    name: 'tuition_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  tuitionAmount!: number;

  @Column({ name: 'meal_days', type: 'int', default: 0 })
  mealDays!: number;

  @Column({
    name: 'meal_daily_rate',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  mealDailyRate!: number;

  /**
   * meal_amount: GENERATED ALWAYS AS (meal_days * meal_daily_rate) STORED
   * TypeORM: chỉ đọc (SELECT), không INSERT/UPDATE — dùng select:true + insert/update:false
   * Cần type: 'decimal' tường minh và nullable để tránh DataTypeNotSupportedError
   */
  @Column({
    name: 'meal_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    nullable: true,
    insert: false,
    update: false,
  })
  mealAmount!: number;

  @Column({
    name: 'other_fees',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  otherFees!: number;

  @Column({
    name: 'discount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  discount!: number;

  /**
   * total_amount: GENERATED ALWAYS AS (...) STORED
   * TypeORM: chỉ đọc (SELECT), không INSERT/UPDATE
   */
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    nullable: true,
    insert: false,
    update: false,
  })
  totalAmount!: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
  })
  amountPaid!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  })
  status!: InvoiceStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt!: Date | null;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
