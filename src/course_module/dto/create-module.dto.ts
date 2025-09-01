import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ description: 'The ID of the course this module belongs to' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'The title of the module' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The content of the module' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'The module number in the course sequence', required: false })
  @IsNumber()
  @IsOptional()
  moduleNumber?: number;

  @ApiProperty({ description: 'The duration of the module', required: false })
  @IsString()
  @IsOptional()
  duration?: string;
}