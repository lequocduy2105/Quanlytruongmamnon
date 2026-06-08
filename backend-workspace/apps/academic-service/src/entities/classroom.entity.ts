import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Teacher } from './teacher.entity';
import { Student } from './student.entity';

/**
 * Classroom entity.
 *
 * grade_level: khối lớp chuẩn mầm non Việt Nam:
 *   - 'mam'  = Lớp Mầm  (3 tuổi)
 *   - 'choi' = Lớp Chồi (4 tuổi)
 *   - 'la'   = Lớp Lá   (5 tuổi)
 *
 * academic_year: năm học, VD "2025-2026"
 * status: soft delete – archived khi lớp kết thúc năm học
 */
@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher!: Teacher;

  @Column({ type: 'int', nullable: true })
  max_capacity!: number;

  /** Chuỗi mô tả độ tuổi (legacy, giữ lại để không break data cũ) */
  @Column({ type: 'varchar', nullable: true })
  age_group!: string;

  @OneToMany(() => Student, (student) => student.classroom)
  students!: Student[];

  // ─── Grade Level chuẩn nghiệp vụ ────────────────────────────────────────
  /**
   * Khối lớp theo độ tuổi chuẩn Bộ GD:
   *   mam  → 3 tuổi (tính đến 31/8 năm học)
   *   choi → 4 tuổi
   *   la   → 5 tuổi
   * NULL = lớp hỗn hợp hoặc lớp đặc biệt
   */
  @Column({
    name: 'grade_level',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  grade_level!: 'mam' | 'choi' | 'la' | null;

  /** Năm học, VD: "2025-2026" */
  @Column({ name: 'academic_year', type: 'varchar', length: 9, nullable: true })
  academic_year!: string | null;

  // ─── Soft Delete ─────────────────────────────────────────────────────────
  /**
   * Trạng thái lớp:
   * - active:   đang hoạt động bình thường
   * - inactive: tạm đóng (không nhận học sinh mới)
   * - archived: đã kết thúc năm học (học sinh đã lên lớp mới)
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status!: 'active' | 'inactive' | 'archived';
}
