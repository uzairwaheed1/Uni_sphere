import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Program } from '../../programs/program.entity';
import { CourseModule } from '../../course_module/module.entity';

@Entity('courses')
export class Course {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Program ID this course belongs to', example: 'uuid' })
  @Column({ type: 'uuid' })
  programId: string;

  @ApiProperty({ description: 'Course title', example: 'Introduction to Programming' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Course description', example: 'A comprehensive introduction to programming concepts' })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'Semester number', example: 1, minimum: 1, maximum: 8 })
  @Column()
  semester: number;

  @ApiProperty({ description: 'Number of credit hours', example: 3, minimum: 1 })
  @Column()
  creditHours: number;

  @ApiProperty({ description: 'Prerequisites for the course', example: 'Basic Programming, Mathematics', required: false })
  @Column({ nullable: true })
  prerequisites: string;

  @ApiProperty({ description: 'Course code', example: 'CS101', required: false })
  @Column({ nullable: true })
  courseCode: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ type: () => Program })
  @ManyToOne(() => Program, program => program.courses, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @ApiProperty({ type: () => [CourseModule] })
  @OneToMany(() => CourseModule, module => module.course)
  modules: CourseModule[];
}