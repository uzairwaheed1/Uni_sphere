import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from '../department/entities/department.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Program } from 'src/programs/program.entity';

@Entity()
export class University {
  @ApiProperty({ description: 'Unique identifier of the university', example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the university', example: 'Stanford University' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Location of the university', example: 'California, USA' })
  @Column()
  location: string;

  @ApiProperty({ description: 'Description of the university', required: false, example: 'A leading research university' })
  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => Program, (program) => program.university)
  program: Program[];
}
