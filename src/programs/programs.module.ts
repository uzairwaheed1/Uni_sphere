import { Module } from '@nestjs/common';
import { ProgramController } from './programs.controller';
import { ProgramService } from './programs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './program.entity';
import { Department } from '../department/entities/department.entity';
import { University } from 'src/universities/university.entity';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Program, University]),    
  LoggerModule
],
  controllers: [ProgramController],
  providers: [ProgramService]
})
export class ProgramsModule {}
