import { Controller, Get, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppLoggerService } from './common/logger/logger.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info('Hello endpoint accessed', { context: 'AppController' });

    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    this.logger.info('Profile endpoint accessed', { 
      context: 'AppController', 
      userId: req.user?.id,
      userEmail: req.user?.email 
    });
    return req.user;
  }

   @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected(@Req() req) {
    console.log('req.user:', req.user);
    return req.user;
  }   
}
