import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {CourseModule} from './module.entity';
import { CourseModulePdf } from './entities/course-module-pdf.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseModuleController } from './course_module.controller';
import { CourseModuleService } from './course_module.service';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseModule, CourseModulePdf]),
    TypeOrmModule.forFeature([Course]),
    LoggerModule
  ],
  controllers: [CourseModuleController],
  providers: [CourseModuleService],
  exports: [CourseModuleService]
})
export class CourseModuleModule {}
