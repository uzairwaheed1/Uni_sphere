// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { UsersProfileService } from '../user_profile/user_profile.service';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private readonly usersService: UsersProfileService,
    
    private readonly logger: AppLoggerService,
  ) {}

  async signup(dto: SignupDto) {
    this.logger.logWithMeta('info', 'User signup attempt', { email: dto.email, role: dto.role }, 'AuthService');


    const {name, email, password, role, profile} = dto;

    // Check if user exists
    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser) {
      this.logger.logWithMeta('warn', 'Signup failed - email already exists', { email }, 'AuthService');

      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);
    const user = this.userRepo.create({ name, email, password: hashed, role });
    await this.userRepo.save(user);
    
     // Create user and profile in a transaction
     if(profile){
    const result = await this.usersService.createUserWithProfile(user, profile);
    if (!result) {
      throw new ConflictException('User creation failed');
    }
  }
    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    this.logger.logWithMeta('info', 'User login attempt', { email: dto.email }, 'AuthService');
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    this.logger.debug('User found in database', 'AuthService');
    this.logger.logWithMeta('debug', 'Login DTO received', { email: dto.email }, 'AuthService');
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      this.logger.warn('Login failed - invalid credentials', 'AuthService');
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.logWithMeta('info', 'User login successful', { email: dto.email, userId: user.id }, 'AuthService');
    return this.signToken(user);
  }

  private signToken(user: User) {
    this.logger.logWithMeta('debug', 'Generating JWT token', { userId: user.id, email: user.email }, 'AuthService');
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
     };
  }
}
