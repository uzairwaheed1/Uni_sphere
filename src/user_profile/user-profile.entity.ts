// src/users/entities/user-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/users.entity';
import { University } from '../universities/university.entity';
import { Department } from '../department/entities/department.entity';
import { Program } from '..//programs/program.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_profiles')
export class UserProfile {
  @ApiProperty({ description: 'Unique identifier of the user profile', example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID of the associated user', example: 'uuid-string' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  @Column()
  fullName: string;

  @ApiProperty({ description: 'ID of the associated university', required: false, example: 'uuid-string' })
  @Column({ type: 'uuid', nullable: true })
  universityId: string;


  @ApiProperty({ description: 'ID of the associated program', required: false, example: 'uuid-string' })
  @Column({ type: 'uuid', nullable: true })
  programId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => University, { nullable: true })
  @JoinColumn({ name: 'universityId' })
  university: University;


  @ManyToOne(() => Program, { nullable: true })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @OneToOne(() => Subscription, subscription => subscription.user)
  subscription: Subscription;
}
