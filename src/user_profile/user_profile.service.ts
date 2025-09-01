import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { User } from '../auth/users.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private readonly logger: AppLoggerService,
  ) {}

  async createUserWithProfile(user: User, profileDto: CreateUserProfileDto, requestId?: string) {
    this.logger.logServiceOperation(
      'CREATE_USER_WITH_PROFILE',
      'UserProfile',
      requestId,
      user.email,
      { 
        userEmail: user.email,
        userRole: user.role,
        profileData: {
          fullName: profileDto.fullName,
          programId: profileDto.programId,
          universityId: profileDto.universityId
        }
      },
      'UsersProfileService'
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedUser = await queryRunner.manager.save(User, user);
      
      const profile = this.userProfileRepository.create({
        ...profileDto,
        userId: savedUser.id,
      });
      
      const savedProfile = await queryRunner.manager.save(UserProfile, profile);
      
      await queryRunner.commitTransaction();
      
      this.logger.logServiceOperation(
        'CREATE_USER_WITH_PROFILE_SUCCESS',
        'UserProfile',
        requestId,
        savedUser.id,
        { 
          userId: savedUser.id,
          userEmail: savedUser.email,
          profileId: savedProfile.id,
          programId: savedProfile.programId
        },
        'UsersProfileService'
      );

      return { user: savedUser, profile: savedProfile };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      
      this.logger.logServiceError(
        'CREATE_USER_WITH_PROFILE',
        'UserProfile',
        err as Error,
        requestId,
        user.email,
        'UsersProfileService'
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getProfileByUserId(userId: string, requestId?: string): Promise<UserProfile> {
    this.logger.logServiceOperation(
      'GET_PROFILE_BY_USER_ID',
      'UserProfile',
      requestId,
      userId,
      { userId },
      'UsersProfileService'
    );

    try {
      const profile = await this.userProfileRepository
        .createQueryBuilder('profile')
        .leftJoinAndSelect('profile.program', 'program')
        .leftJoinAndSelect('program.courses', 'courses')
        .leftJoinAndSelect('courses.modules', 'modules')
        .where('profile.userId = :userId', { userId })
        .getOne();

      if (!profile) {
        this.logger.logServiceOperation(
          'GET_PROFILE_BY_USER_ID_NOT_FOUND',
          'UserProfile',
          requestId,
          userId,
          { userId },
          'UsersProfileService'
        );
        throw new NotFoundException('Profile not found');
      }

      // Add subscription status check
      if (profile.subscription) {
        const isActive = new Date() <= new Date(profile.subscription.endDate);
        profile['subscriptionStatus'] = isActive ? 'active' : 'expired';
      } else {
        profile['subscriptionStatus'] = 'none';
      }

      this.logger.logServiceOperation(
        'GET_PROFILE_BY_USER_ID_SUCCESS',
        'UserProfile',
        requestId,
        userId,
        { 
          userId,
          profileId: profile.id,
          programId: profile.programId,
          subscriptionStatus: profile['subscriptionStatus'],
          courseCount: profile.program?.courses?.length || 0
        },
        'UsersProfileService'
      );

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'GET_PROFILE_BY_USER_ID',
        'UserProfile',
        error as Error,
        requestId,
        userId,
        'UsersProfileService'
      );
      throw error;
    }
  }

  async updateProfile(userId: string, updateDto: UpdateUserProfileDto, requestId?: string): Promise<UserProfile> {
    this.logger.logServiceOperation(
      'UPDATE_PROFILE',
      'UserProfile',
      requestId,
      userId,
      { 
        userId,
        updateFields: Object.keys(updateDto)
      },
      'UsersProfileService'
    );

    try {
      const profile = await this.getProfileByUserId(userId, requestId);
      
      Object.assign(profile, updateDto);
      
      const updatedProfile = await this.userProfileRepository.save(profile);
      
      this.logger.logServiceOperation(
        'UPDATE_PROFILE_SUCCESS',
        'UserProfile',
        requestId,
        userId,
        { 
          userId,
          profileId: updatedProfile.id,
          programId: updatedProfile.programId
        },
        'UsersProfileService'
      );

      return updatedProfile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'UPDATE_PROFILE',
        'UserProfile',
        error as Error,
        requestId,
        userId,
        'UsersProfileService'
      );
      throw error;
    }
  }
}
