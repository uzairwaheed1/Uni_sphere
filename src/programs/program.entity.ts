import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../department/entities/department.entity';
import { Course } from '../courses/entities/course.entity';
import { University } from '../universities/university.entity';

@Entity('program')
export class Program {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Program name', example: 'Bachelor of Computer Science' })
  @Column()
  name: string;

  @ApiProperty({ 
    description: 'Program description', 
    example: 'Four-year undergraduate program in computer science',
    required: false
  })
  @Column('text', { nullable: true })
  description: string;

  // @ApiProperty({ description: 'Department ID this program belongs to', example: 'uuid' })
  // @Column({ type: 'uuid' })
  // departmentId: string;

    @ApiProperty({ description: 'University ID this program belongs to', example: 'uuid' })
  @Column({ type: 'uuid' })
  universityId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

    @ApiProperty({ type: () => University })
  @ManyToOne(() => University, university => university.program, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({name: 'universityId'})
  university: University;
  // @ApiProperty({ type: () => Department })
  // @ManyToOne(() => Department, department => department.programs, {
  //   onDelete: 'CASCADE'
  // })
  // @JoinColumn({ name: 'departmentId' })
  // department: Department;

  @ApiProperty({ type: () => [Course] })
  @OneToMany(() => Course, course => course.program)
  courses: Course[];
}
