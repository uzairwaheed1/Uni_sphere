import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './program.entity';
import { CreateProgramDto } from './dto/create-programs.dto';
import { UpdateProgramDto } from './dto/update-programs.dto';
import { Department } from '../department/entities/department.entity';
import { University } from 'src/universities/university.entity';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
    @InjectRepository(University)
    private universityRepo: Repository<University>,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateProgramDto, requestId?: string, userId?: string): Promise<Program> {
    this.logger.logServiceOperation(
      'CREATE',
      'Program',
      requestId,
      userId,
      { 
        universityId: dto.universityId,
        programName: dto.name 
      },
      'ProgramService'
    );

    try {
      const university = await this.universityRepo.findOne({ where: { id: dto.universityId } });
      if (!university) {
        this.logger.logServiceOperation(
          'CREATE_UNIVERSITY_NOT_FOUND',
          'Program',
          requestId,
          userId,
          { universityId: dto.universityId },
          'ProgramService'
        );
        throw new NotFoundException('University not found');
      }

      const program = this.programRepo.create({ ...dto, university });
      const savedProgram = await this.programRepo.save(program);
      
      this.logger.logServiceOperation(
        'CREATE_SUCCESS',
        'Program',
        requestId,
        userId,
        { 
          programId: savedProgram.id,
          programName: savedProgram.name,
          universityId: savedProgram.universityId
        },
        'ProgramService'
      );

      return savedProgram;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'CREATE',
        'Program',
        error as Error,
        requestId,
        userId,
        'ProgramService'
      );
      throw error;
    }
  }

  async findAll(requestId?: string, userId?: string): Promise<Program[]> {
    this.logger.logServiceOperation(
      'FIND_ALL',
      'Program',
      requestId,
      userId,
      {},
      'ProgramService'
    );

    try {
      const programs = await this.programRepo.find({ relations: ['university'] });
      
      this.logger.logServiceOperation(
        'FIND_ALL_SUCCESS',
        'Program',
        requestId,
        userId,
        { programCount: programs.length },
        'ProgramService'
      );

      return programs;
    } catch (error) {
      this.logger.logServiceError(
        'FIND_ALL',
        'Program',
        error as Error,
        requestId,
        userId,
        'ProgramService'
      );
      throw error;
    }
  }

  async findOne(id: string, requestId?: string, userId?: string): Promise<Program> {
    this.logger.logServiceOperation(
      'FIND_ONE',
      'Program',
      requestId,
      userId,
      { programId: id },
      'ProgramService'
    );

    try {
      const program = await this.programRepo.findOne({ where: { id }, relations: ['university', 'courses'] });
      if (!program) {
        this.logger.logServiceOperation(
          'FIND_ONE_NOT_FOUND',
          'Program',
          requestId,
          userId,
          { programId: id },
          'ProgramService'
        );
        throw new NotFoundException('Program not found');
      }
      
      this.logger.logServiceOperation(
        'FIND_ONE_SUCCESS',
        'Program',
        requestId,
        userId,
        { 
          programId: program.id,
          programName: program.name,
          universityId: program.universityId,
          courseCount: program.courses?.length || 0
        },
        'ProgramService'
      );

      return program;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'FIND_ONE',
        'Program',
        error as Error,
        requestId,
        userId,
        'ProgramService'
      );
      throw error;
    }
  }

  async update(id: string, dto: UpdateProgramDto, requestId?: string, userId?: string): Promise<Program> {
    this.logger.logServiceOperation(
      'UPDATE',
      'Program',
      requestId,
      userId,
      { 
        programId: id,
        updateFields: Object.keys(dto)
      },
      'ProgramService'
    );

    try {
      const program = await this.findOne(id, requestId, userId);

      if (dto.universityId) {
        const university = await this.universityRepo.findOne({ where: { id: dto.universityId } });
        if (!university) {
          this.logger.logServiceOperation(
            'UPDATE_UNIVERSITY_NOT_FOUND',
            'Program',
            requestId,
            userId,
            { programId: id, universityId: dto.universityId },
            'ProgramService'
          );
          throw new NotFoundException('university not found');
        }
        program.university = university;
      }

      Object.assign(program, dto);
      const updatedProgram = await this.programRepo.save(program);
      
      this.logger.logServiceOperation(
        'UPDATE_SUCCESS',
        'Program',
        requestId,
        userId,
        { 
          programId: updatedProgram.id,
          programName: updatedProgram.name,
          universityId: updatedProgram.universityId
        },
        'ProgramService'
      );

      return updatedProgram;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'UPDATE',
        'Program',
        error as Error,
        requestId,
        userId,
        'ProgramService'
      );
      throw error;
    }
  }

  async remove(id: string, requestId?: string, userId?: string): Promise<void> {
    this.logger.logServiceOperation(
      'DELETE',
      'Program',
      requestId,
      userId,
      { programId: id },
      'ProgramService'
    );

    try {
      const result = await this.programRepo.delete(id);
      if (result.affected === 0) {
        this.logger.logServiceOperation(
          'DELETE_NOT_FOUND',
          'Program',
          requestId,
          userId,
          { programId: id },
          'ProgramService'
        );
        throw new NotFoundException('Program not found');
      }
      
      this.logger.logServiceOperation(
        'DELETE_SUCCESS',
        'Program',
        requestId,
        userId,
        { programId: id },
        'ProgramService'
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'DELETE',
        'Program',
        error as Error,
        requestId,
        userId,
        'ProgramService'
      );
      throw error;
    }
  }
}
