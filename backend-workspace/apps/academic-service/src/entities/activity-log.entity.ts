import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'teacher_id', type: 'int', nullable: true })
  teacherId!: number | null;

  @ManyToOne(() => Teacher, { nullable: true, eager: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: Teacher | null;

  @Column({ type: 'varchar', length: 100 })
  category!: string; // e.g. 'Behavioral', 'Academic', 'Health', 'Social'

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column('text')
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
