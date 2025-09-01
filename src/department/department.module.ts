import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { University } from '../universities/university.entity';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Department, University])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule {}
