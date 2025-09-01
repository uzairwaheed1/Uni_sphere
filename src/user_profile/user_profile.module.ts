import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './user-profile.entity';
import { User } from '../auth/users.entity';
import { UsersProfileService } from './user_profile.service';
import { UsersProfileController } from './user_profile.controller';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile, User]),
    LoggerModule,
  ],
  controllers: [UsersProfileController],
  providers: [UsersProfileService],
  exports: [UsersProfileService],
})
export class UsersProfileModule {}
