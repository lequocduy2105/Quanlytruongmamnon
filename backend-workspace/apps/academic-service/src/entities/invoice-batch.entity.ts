import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type BatchStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

@Entity('invoice_batches')
export class InvoiceBatch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'month', type: 'char', length: 7 })
  month!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PROCESSING',
  })
  status!: BatchStatus;

  @Column({ name: 'total_records', type: 'int', default: 0 })
  totalRecords!: number;

  @Column({ name: 'success_records', type: 'int', default: 0 })
  successRecords!: number;

  @Column({ name: 'error_log', type: 'text', nullable: true })
  errorLog!: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;
}
