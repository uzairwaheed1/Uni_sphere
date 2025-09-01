// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from './users.entity';
import { UsersProfileModule } from '../user_profile/user_profile.module';
import { LoggerModule } from '../common/logger/logger.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: 'jwt_secret', // move to env
      signOptions: { expiresIn: '7d' },
    }),
    UsersProfileModule,
    LoggerModule, 
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard,
    RolesGuard],
  exports: [ 
    JwtStrategy, 
    JwtModule,
    JwtAuthGuard,    // Added export
    RolesGuard ]
})
export class AuthModule {}
