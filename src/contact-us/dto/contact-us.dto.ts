import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactUsDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the person contacting us'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'Email address for response'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'I have a question about your services...',
    description: 'The message or query from the user'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  query: string;
}
