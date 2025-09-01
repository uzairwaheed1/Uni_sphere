import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science', description: 'The name of the department' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Department of Computer Science and Engineering',
    description: 'Detailed description of the department'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'UUID of the university this department belongs to' })
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

}