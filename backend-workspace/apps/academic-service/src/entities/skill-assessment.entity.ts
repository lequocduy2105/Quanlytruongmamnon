import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';

/**
 * SkillAssessment - đánh giá kỹ năng học sinh.
 * Quan hệ với Student và Teacher đều nằm trong cùng academic-service → OK.
 */
@Entity('skill_assessments')
export class SkillAssessment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: Teacher;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cognitive_score!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  social_score!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  motor_score!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  emotional_score!: number;

  @Column({ type: 'text', nullable: true, default: null })
  deficiency_log!: string | null;

  // QUAN TRỌNG: phải có name: 'created_at' để khớp tên cột trong DB
  // Nếu thiếu name, TypeORM tự dùng 'createdAt' → SELECT fails vì DB dùng 'created_at'
  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
