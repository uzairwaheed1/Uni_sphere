// src/users/dto/create-user-profile.dto.ts
import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsUUID()
  @IsOptional()
  universityId?: string;


  @IsUUID()
  @IsOptional()
  programId?: string;
}