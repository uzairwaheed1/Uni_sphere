import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CourseModule } from '../module.entity';

@Entity('course_module_pdfs')
export class CourseModulePdf {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  courseModuleId: string;

  @ApiProperty()
  @Column()
  fileName: string;

  @ApiProperty()
  @Column()
  filePath: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  uploadedBy: string;

  @ApiProperty()
  @CreateDateColumn()
  uploadedAt: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  fileSize: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  mimeType: string;

  // Relationship with CourseModule
  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseModuleId' })
  courseModule: CourseModule;
}
