import { Module } from '@nestjs/common';
import { UniversityController } from './universities.controller';
import { UniversityService } from './universities.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from './university.entity';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([University]),
    LoggerModule,
  ],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversitiesModule {}
