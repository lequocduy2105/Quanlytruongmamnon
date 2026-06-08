import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Student } from './student.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';

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

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;


  @Column({ name: 'month', type: 'char', length: 7 })
  month!: string; // YYYY-MM

  @Column({
    name: 'subtotal_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  subtotalAmount!: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  discountAmount!: number;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  refundAmount!: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  totalAmount!: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  amountPaid!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  })
  status!: InvoiceStatus;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

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

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items!: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments!: Payment[];
}
