import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'UUID of the program this course belongs to' })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 'Introduction to Programming' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A comprehensive introduction to programming concepts' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 8 })
  @IsNumber()
  @Min(1)
  @Max(8)
  semester: number;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsNumber()
  @Min(1)
  creditHours: number;

  @ApiProperty({ required: false, example: 'Basic Programming, Mathematics' })
  @IsString()
  @IsOptional()
  prerequisites?: string;

  @ApiProperty({ required: false, example: 'CS101' })
  @IsString()
  @IsOptional()
  courseCode?: string;
}

