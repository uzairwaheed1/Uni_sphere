import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { User } from '../auth/users.entity';
import { Program } from '../programs/program.entity';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    private readonly logger: AppLoggerService,
  ) {}

async createCourse(createCourseDto: CreateCourseDto, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'CREATE',
      'Course',
      requestId,
      user?.id,
      { 
        programId: createCourseDto.programId,
        courseTitle: createCourseDto.title 
      },
      'CoursesService'
    );

    try {
      // Validate program existence
      const program = await this.programRepository.findOne({
        where: { id: createCourseDto.programId }
      });

      if (!program) {
        this.logger.logServiceOperation(
          'CREATE_PROGRAM_NOT_FOUND',
          'Course',
          requestId,
          user?.id,
          { programId: createCourseDto.programId },
          'CoursesService'
        );
        throw new BadRequestException(`Program with ID ${createCourseDto.programId} not found`);
      }

      const course = this.courseRepository.create(createCourseDto);
      const savedCourse = await this.courseRepository.save(course);
      
      this.logger.logServiceOperation(
        'CREATE_SUCCESS',
        'Course',
        requestId,
        user?.id,
        { 
          courseId: savedCourse.id,
          courseTitle: savedCourse.title,
          programId: savedCourse.programId
        },
        'CoursesService'
      );

      return savedCourse;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'CREATE',
        'Course',
        error as Error,
        requestId,
        user?.id,
        'CoursesService'
      );
      throw error;
    }
  }

  async getCoursesByProgramId(programId: string, requestId?: string, userId?: string) {
    this.logger.logServiceOperation(
      'FIND_BY_PROGRAM',
      'Course',
      requestId,
      userId,
      { programId },
      'CoursesService'
    );

    try {
      const courses = await this.courseRepository.find({
        where: { programId },
        relations: ['modules'],
        order: {
          createdAt: 'DESC',
        },
      });
      
      this.logger.logServiceOperation(
        'FIND_BY_PROGRAM_SUCCESS',
        'Course',
        requestId,
        userId,
        { 
          programId,
          courseCount: courses.length 
        },
        'CoursesService'
      );

      return courses;

    } catch (error) {
      this.logger.logServiceError(
        'FIND_BY_PROGRAM',
        'Course',
        error as Error,
        requestId,
        userId,
        'CoursesService'
      );
      throw error;
    }
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'UPDATE',
      'Course',
      requestId,
      user?.id,
      { 
        courseId: id,
        updateFields: Object.keys(updateCourseDto)
      },
      'CoursesService'
    );

    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['program'],
      });

      if (!course) {
        this.logger.logServiceOperation(
          'UPDATE_NOT_FOUND',
          'Course',
          requestId,
          user?.id,
          { courseId: id },
          'CoursesService'
        );
        throw new NotFoundException('Course not found');
      }

      Object.assign(course, updateCourseDto);
      const updatedCourse = await this.courseRepository.save(course);
      
      this.logger.logServiceOperation(
        'UPDATE_SUCCESS',
        'Course',
        requestId,
        user?.id,
        { 
          courseId: updatedCourse.id,
          courseTitle: updatedCourse.title,
          programId: updatedCourse.programId
        },
        'CoursesService'
      );

      return updatedCourse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'UPDATE',
        'Course',
        error as Error,
        requestId,
        user?.id,
        'CoursesService'
      );
      throw error;
    }
  }

  async deleteCourse(id: string, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'DELETE',
      'Course',
      requestId,
      user?.id,
      { courseId: id },
      'CoursesService'
    );

    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['modules'],

      });

      console.log(course);
      
      
      if (!course) {
        this.logger.logServiceOperation(
          'DELETE_NOT_FOUND',
          'Course',
          requestId,
          user?.id,
          { courseId: id },
          'CoursesService'
        );
        throw new NotFoundException('Course not found');
      }
      
      if ((course.modules ?? []).length > 0) {
        throw new BadRequestException('Course has modules, cannot delete');
      }

      await this.courseRepository.remove(course);
      
      this.logger.logServiceOperation(
        'DELETE_SUCCESS',
        'Course',
        requestId,
        user?.id,
        { 
          courseId: id,
          courseTitle: course.title,
          programId: course.programId
        },
        'CoursesService'
      );

      return { message: 'Course deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'DELETE',
        'Course',
        error as Error,
        requestId,
        user?.id,
        'CoursesService'
      );
      throw error;
    }
  }
}