import { Role } from "../users.entity";
import { IsEnum, IsOptional, IsString, IsNotEmpty } from "class-validator";
import { CreateUserProfileDto } from "../../user_profile/dto/create-user-profile.dto";
import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
// src/auth/dto/signup.dto.ts
export class SignupDto {
    @ApiProperty({ example: 'john.doe@example.com' })

    @IsString()
    name: string;

    @IsString()
    email: string;

      @ApiProperty({ 
    example: 'password123',
    minLength: 6 
  })
    @IsString()
    password: string;

      @ApiProperty({ 
    enum: Role,
    default: Role.STUDENT,
    required: false
  })
    @IsOptional()
    @IsEnum(Role, { message: 'role must be one of Role enum values' })
    role?: Role; // Optional, default to student
    
      @ApiProperty({ type: () => CreateUserProfileDto })
  @ValidateNested()
  @Type(() => CreateUserProfileDto)
  @IsOptional()
  profile?: CreateUserProfileDto;    
  }

  