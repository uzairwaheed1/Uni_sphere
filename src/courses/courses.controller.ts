import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AppLoggerService } from '../common/logger/logger.service';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('create-course')
  @Roles('super_admin','program_admin')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only program admins can create courses.' })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('POST /courses/create-course accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      programId: createCourseDto.programId,
      courseTitle: createCourseDto.title,
    });

    return this.coursesService.createCourse(createCourseDto, req.user, requestId);
  }

  @Get('program/:programId')
  @ApiOperation({ summary: 'Get all courses for a program' })
  @ApiResponse({ status: 200, description: 'Returns all courses for the specified program.' })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  getCoursesByProgram(@Param('programId') programId: string, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('GET /courses/program/:programId accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      programId,
    });

    return this.coursesService.getCoursesByProgramId(programId, requestId, userId);
  }

  @Put('update-course/:id')
  @Roles('super_admin','program_admin')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course has been successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only program admins can update courses.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req
  ) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('PUT /courses/update-course/:id accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      courseId: id,
      updateFields: Object.keys(updateCourseDto),
    });

    return this.coursesService.updateCourse(id, updateCourseDto, req.user, requestId);
  }

  @Delete('delete-course/:id')
  @Roles('super_admin','program_admin')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only program admins can delete courses.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  remove(@Param('id') id: string, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('DELETE /courses/delete-course/:id accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      courseId: id,
    });

    return this.coursesService.deleteCourse(id, req.user, requestId);
  }
}