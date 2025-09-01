import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { University } from '../../universities/university.entity';
import { Program } from '../../programs/program.entity';

@Entity('department')
export class Department {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Department name', example: 'Computer Science' })
  @Column()
  name: string;

  @ApiProperty({ 
    description: 'Department description', 
    example: 'Department of Computer Science and Engineering' 
  })
  @Column()
  description: string;

  @ApiProperty({ description: 'University ID this department belongs to', example: 'uuid' })
  @Column({ type: 'uuid' })
  universityId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // @ApiProperty({ type: () => University })
  // @ManyToOne(() => University, university => university.departments, {
  //   onDelete: 'CASCADE'
  // })
  @JoinColumn({ name: 'universityId' })
  university: University;

  // @ApiProperty({ type: () => [Program] })
  // @OneToMany(() => Program, program => program.department)
  // programs: Program[];
}