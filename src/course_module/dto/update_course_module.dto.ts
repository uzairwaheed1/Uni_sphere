// update-course.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateModuleDto } from './create-module.dto';

export class UpdateCourseModuleDto extends PartialType(CreateModuleDto) {}