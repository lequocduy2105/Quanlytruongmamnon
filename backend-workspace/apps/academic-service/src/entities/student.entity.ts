import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Classroom } from './classroom.entity';

/**
 * Student entity - thuộc academic-service.
 * guardian_user_id là foreign key tới bảng users (auth-service).
 * Không dùng TypeORM relation cross-service trong Microservices.
 */
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  full_name!: string;

  @ManyToOne(() => Classroom, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom;

  @Column({ name: 'guardian_user_id', type: 'int', nullable: true })
  guardianUserId!: number;

  @Column({ type: 'date', nullable: true })
  date_of_birth!: Date;

  // ─── Thông tin dị ứng ────────────────────────────────────────────────────
  /** Danh sách dị ứng, lưu dạng CSV: "Đậu phộng,Hải sản" */
  @Column('simple-array', { nullable: true })
  allergy_tags!: string[];

  /**
   * Mức độ nghiêm trọng của dị ứng.
   * NONE = không dị ứng | MILD = nổi mẩn nhẹ |
   * SEVERE = phản ứng mạnh | ANAPHYLACTIC = sốc phản vệ → CẤP CỨU
   */
  @Column({
    name: 'allergy_severity',
    type: 'enum',
    enum: ['NONE', 'MILD', 'SEVERE', 'ANAPHYLACTIC'],
    default: 'NONE',
  })
  allergy_severity!: 'NONE' | 'MILD' | 'SEVERE' | 'ANAPHYLACTIC';

  /**
   * Kế hoạch xử lý khi dị ứng xảy ra.
   * VD: "Gọi 115 ngay, dùng EpiPen trong tủ y tế, liên hệ PH số 0912..."
   */
  @Column({ name: 'emergency_action', type: 'text', nullable: true })
  emergency_action!: string | null;

  // ─── Liên hệ khẩn cấp ────────────────────────────────────────────────────
  /** Tên người liên hệ khẩn cấp (có thể khác số PH đăng ký) */
  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 100, nullable: true })
  emergency_contact_name!: string | null;

  /** SĐT người liên hệ khẩn cấp */
  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergency_contact_phone!: string | null;

  /** Quan hệ với học sinh: Ba/Mẹ/Ông/Bà... */
  @Column({ name: 'emergency_contact_relation', type: 'varchar', length: 50, nullable: true })
  emergency_contact_relation!: string | null;

  // ─── Thông tin y tế cơ bản ────────────────────────────────────────────────
  /** Nhóm máu: A+/A-/B+/B-/AB+/AB-/O+/O- */
  @Column({ name: 'blood_type', type: 'varchar', length: 5, nullable: true })
  blood_type!: string | null;

  /** Ghi chú sức khoẻ đặc biệt (bệnh nền, lưu ý khác) */
  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medical_notes!: string | null;
}
