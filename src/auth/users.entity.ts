// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany   } from 'typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
export enum Role {
  SUPER_ADMIN = 'super_admin',
  UNIVERSITY_ADMIN = 'university_admin',
  PROGRAM_ADMIN = 'program_admin',
  DEPARTMENT_ADMIN = 'department_admin',
  STUDENT = 'student',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  @OneToMany(() => Subscription, (sub) => sub.user)
subscriptions: Subscription[];

}
