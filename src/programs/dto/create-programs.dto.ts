import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramDto {
  @ApiProperty({ example: 'Bachelor of Computer Science' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Four-year undergraduate program in computer science',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'UUID of the university' })
  @IsUUID()
  @IsNotEmpty()
  universityId: string;
}
