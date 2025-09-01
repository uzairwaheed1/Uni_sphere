import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './users.entity';
import { AppLoggerService } from '../common/logger/logger.service';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly logger: AppLoggerService,
    private reflector: Reflector,

  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debug logging
    this.logger.debug('Role authorization check', { 
      context: 'RolesGuard', 
      requiredRoles, 
      userRole: user?.role,
      userId: user?.id 
    });

    const hasRole = requiredRoles.some((role) => user.role?.includes(role));
    
    // if (!user) {
    //   throw new UnauthorizedException('User not authenticated');
    // }

    if (!hasRole) {
      this.logger.warn('Role authorization failed', { 
        context: 'RolesGuard', 
        requiredRoles, 
        userRole: user?.role,
        userId: user?.id 
      });
    }

    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}

