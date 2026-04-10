import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('authorized_pickups')
@Index(['studentId'])
export class AuthorizedPickup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @ManyToOne(() => Student, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  /** Tên người được ủy quyền */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /** Quan hệ với học sinh: Ông/Bà/Chú/Cô/Người giúp việc... */
  @Column({ type: 'varchar', length: 50 })
  relationship!: string;

  /** Số điện thoại liên hệ */
  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  /** Ngày bắt đầu hiệu lực (NULL = ngay lập tức) */
  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom!: string | null;

  /** Ngày hết hạn (NULL = vô thời hạn) */
  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil!: string | null;

  /** URL ảnh CMND hoặc chân dung để giáo viên đối chiếu */
  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  /** Ghi chú thêm */
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** parent user_id đã tạo ủy quyền này */
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
