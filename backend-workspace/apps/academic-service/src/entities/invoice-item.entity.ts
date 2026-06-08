import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { FeeConfig } from './fee-config.entity';

export type InvoiceItemType =
  | 'tuition'
  | 'meal_expected'
  | 'meal_refund'
  | 'facility'
  | 'transport'
  | 'extracurricular'
  | 'other';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId!: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ name: 'fee_config_id', type: 'int', nullable: true })
  feeConfigId!: number | null;

  @ManyToOne(() => FeeConfig, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fee_config_id' })
  feeConfig!: FeeConfig | null;

  @Column({ name: 'name', length: 255 })
  name!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: [
      'tuition',
      'meal_expected',
      'meal_refund',
      'facility',
      'transport',
      'extracurricular',
      'other',
    ],
  })
  type!: InvoiceItemType;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  unitPrice!: number;

  @Column({ name: 'quantity', type: 'int', default: 1 })
  quantity!: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  subtotal!: number;

  @Column({
    name: 'discount',
    type: 'decimal',
    precision: 12,
    scale: 0,
    default: 0,
    transformer: {
      to: (value: number): number => value,
      from: (value: any): number => Number(value || 0),
    },
  })
  discount!: number;

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

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
