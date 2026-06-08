import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card'
  | 'momo'
  | 'other';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId!: number;

  @ManyToOne(() => Invoice, (inv) => inv.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  amount!: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['cash', 'bank_transfer', 'card', 'momo', 'other'],
    default: 'cash',
  })
  paymentMethod!: PaymentMethod;

  @Column({
    name: 'reference_code',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  referenceCode!: string | null;

  @Column({
    name: 'paid_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  paidAt!: Date;

  @Column({ name: 'received_by', type: 'int', nullable: true })
  receivedBy!: number | null;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
