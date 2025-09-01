import { Controller, Get, Post, Delete, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription.entity';
import { AppLoggerService } from '../common/logger/logger.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid subscription plan.' })
  async subscribe(@Request() req, @Body() plan: SubscriptionPlan) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('POST /subscriptions/subscribe accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      plan,
    });

    return this.subscriptionsService.createSubscription(
      req.user.id,
      plan,
      requestId
    );
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiResponse({ status: 200, description: 'Returns current subscription status.' })
  @ApiResponse({ status: 404, description: 'No active subscription found.' })
  async getStatus(@Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('GET /subscriptions/status accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
    });

    return this.subscriptionsService.getUserSubscription(req.user.id, requestId);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription successfully cancelled.' })
  @ApiResponse({ status: 404, description: 'No active subscription found.' })
  async cancel(@Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('DELETE /subscriptions/cancel accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
    });

    return this.subscriptionsService.cancelSubscription(req.user.id, requestId);
  }
}

