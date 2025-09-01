// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppLoggerService } from '../common/logger/logger.service';
import { UnauthorizedException } from '@nestjs/common';
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor
  (
    private readonly logger: AppLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'jwt_secret', // Move to .env in production
    });
    this.logger.debug('JwtStrategy constructor called', 'JwtStrategy');

  }

  async validate(payload: JwtPayload) {
    this.logger.logWithMeta('debug', 'JWT validate called', { userId: payload.sub }, 'JwtStrategy');
    const user = { id: payload.sub, email: payload.email, role: payload.role };
    if (!user) {
      this.logger.logWithMeta('warn', 'JWT validation failed - user not found', { userId: payload.sub }, 'JwtStrategy');
      throw new UnauthorizedException();
    }
    this.logger.logWithMeta('debug', 'JWT validation successful', { userId: user.id }, 'JwtStrategy');
    return user;
  }
}
