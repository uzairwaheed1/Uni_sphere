import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(University)
    private universityRepo: Repository<University>,
    private readonly logger: AppLoggerService,
  ) {}

  async create(createUniversityDto: CreateUniversityDto, requestId?: string, userId?: string): Promise<University> {
    this.logger.logServiceOperation(
      'CREATE',
      'University',
      requestId,
      userId,
      { universityName: createUniversityDto.name },
      'UniversityService'
    );

    try {
      const university = this.universityRepo.create(createUniversityDto);
      const savedUniversity = await this.universityRepo.save(university);
      
      this.logger.logServiceOperation(
        'CREATE_SUCCESS',
        'University',
        requestId,
        userId,
        { 
          universityId: savedUniversity.id,
          universityName: savedUniversity.name 
        },
        'UniversityService'
      );

      return savedUniversity;
    } catch (error) {
      this.logger.logServiceError(
        'CREATE',
        'University',
        error as Error,
        requestId,
        userId,
        'UniversityService'
      );
      throw error;
    }
  }

  async findAll(requestId?: string, userId?: string): Promise<University[]> {
    this.logger.logServiceOperation(
      'FIND_ALL',
      'University',
      requestId,
      userId,
      {},
      'UniversityService'
    );

    try {
      const universities = await this.universityRepo.find({ relations: ['program'] });
      
      this.logger.logServiceOperation(
        'FIND_ALL_SUCCESS',
        'University',
        requestId,
        userId,
        { count: universities.length },
        'UniversityService'
      );

      return universities;
    } catch (error) {
      this.logger.logServiceError(
        'FIND_ALL',
        'University',
        error as Error,
        requestId,
        userId,
        'UniversityService'
      );
      throw error;
    }
  }

  async findOne(id: string, requestId?: string, userId?: string): Promise<University> {
    this.logger.logServiceOperation(
      'FIND_ONE',
      'University',
      requestId,
      userId,
      { universityId: id },
      'UniversityService'
    );

    try {
      const uni = await this.universityRepo.findOne({ 
        where: { id }, 
        relations: ['program'] 
      });
      
      if (!uni) {
        this.logger.logServiceOperation(
          'FIND_ONE_NOT_FOUND',
          'University',
          requestId,
          userId,
          { universityId: id },
          'UniversityService'
        );
        throw new NotFoundException('University not found');
      }

      this.logger.logServiceOperation(
        'FIND_ONE_SUCCESS',
        'University',
        requestId,
        userId,
        { 
          universityId: uni.id,
          universityName: uni.name,
          programCount: uni.program?.length || 0
        },
        'UniversityService'
      );

      return uni;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'FIND_ONE',
        'University',
        error as Error,
        requestId,
        userId,
        'UniversityService'
      );
      throw error;
    }
  }

  async update(id: string, dto: UpdateUniversityDto, requestId?: string, userId?: string): Promise<University> {
    this.logger.logServiceOperation(
      'UPDATE',
      'University',
      requestId,
      userId,
      { 
        universityId: id,
        updateFields: Object.keys(dto)
      },
      'UniversityService'
    );

    try {
      const updateResult = await this.universityRepo.update(id, dto);
      
      if (updateResult.affected === 0) {
        this.logger.logServiceOperation(
          'UPDATE_NOT_FOUND',
          'University',
          requestId,
          userId,
          { universityId: id },
          'UniversityService'
        );
        throw new NotFoundException('University not found');
      }

      const updatedUniversity = await this.findOne(id, requestId, userId);
      
      this.logger.logServiceOperation(
        'UPDATE_SUCCESS',
        'University',
        requestId,
        userId,
        { 
          universityId: updatedUniversity.id,
          universityName: updatedUniversity.name
        },
        'UniversityService'
      );

      return updatedUniversity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'UPDATE',
        'University',
        error as Error,
        requestId,
        userId,
        'UniversityService'
      );
      throw error;
    }
  }

  async remove(id: string, requestId?: string, userId?: string): Promise<void> {
    this.logger.logServiceOperation(
      'DELETE',
      'University',
      requestId,
      userId,
      { universityId: id },
      'UniversityService'
    );

    try {
      // First check if university exists
      const university = await this.universityRepo.findOne({ where: { id } });
      
      if (!university) {
        this.logger.logServiceOperation(
          'DELETE_NOT_FOUND',
          'University',
          requestId,
          userId,
          { universityId: id },
          'UniversityService'
        );
        throw new NotFoundException('University not found');
      }

      const result = await this.universityRepo.delete(id);
      
      this.logger.logServiceOperation(
        'DELETE_SUCCESS',
        'University',
        requestId,
        userId,
        { 
          universityId: id,
          universityName: university.name
        },
        'UniversityService'
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'DELETE',
        'University',
        error as Error,
        requestId,
        userId,
        'UniversityService'
      );
      throw error;
    }
  }
}
