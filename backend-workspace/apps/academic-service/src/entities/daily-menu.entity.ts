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

/**
 * DailyMenu - Thực đơn hàng ngày của trường.
 * Admin/BGH nhập thực đơn → hệ thống tự kiểm tra dị ứng theo lớp.
 */
@Entity('daily_menus')
export class DailyMenu {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Ngày áp dụng thực đơn (DATE — YYYY-MM-DD) */
  @Column({ type: 'date' })
  menu_date!: string;

  /** Lớp — NULL = áp dụng cho toàn trường */
  @Column({ name: 'class_id', type: 'int', nullable: true })
  classId!: number | null;

  @ManyToOne(() => Classroom, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom | null;

  // ─── Bữa sáng ──────────────────────────────────────────────────────────────
  @Column({
    name: 'breakfast_main',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  breakfast_main!: string | null;

  @Column({ name: 'breakfast_ingredients', type: 'text', nullable: true })
  breakfast_ingredients!: string | null;

  // ─── Bữa trưa ──────────────────────────────────────────────────────────────
  @Column({ name: 'lunch_main', type: 'varchar', length: 300, nullable: true })
  lunch_main!: string | null;

  @Column({ name: 'lunch_soup', type: 'varchar', length: 200, nullable: true })
  lunch_soup!: string | null;

  @Column({ name: 'lunch_ingredients', type: 'text', nullable: true })
  lunch_ingredients!: string | null;

  // ─── Bữa xế ────────────────────────────────────────────────────────────────
  @Column({ name: 'snack_main', type: 'varchar', length: 200, nullable: true })
  snack_main!: string | null;

  @Column({ name: 'snack_ingredients', type: 'text', nullable: true })
  snack_ingredients!: string | null;

  /** Ghi chú thêm (VD: "Không dùng dầu hào") */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** admin user_id tạo thực đơn */
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
