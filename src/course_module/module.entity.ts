import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../courses/entities/course.entity';

@Entity('course_modules')
export class CourseModule {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column('text')
  content: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  moduleNumber: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  duration: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Course, course => course.modules)
  @JoinColumn({ name: 'courseId' })
  course: Course;
}