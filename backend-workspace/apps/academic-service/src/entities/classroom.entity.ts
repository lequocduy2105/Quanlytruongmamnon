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

  @Column({ type: 'varchar', nullable: true })
  age_group!: string;

  @OneToMany(() => Student, (student) => student.classroom)
  students!: Student[];
}
