import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './entities/subscription.entity';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly logger: AppLoggerService,
  ) {}

  async createSubscription(userId: string, plan: SubscriptionPlan, requestId?: string) {
    this.logger.logServiceOperation(
      'CREATE',
      'Subscription',
      requestId,
      userId,
      { plan },
      'SubscriptionsService'
    );

    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const subscription = this.subscriptionRepository.create({
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate,
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);
      
      this.logger.logServiceOperation(
        'CREATE_SUCCESS',
        'Subscription',
        requestId,
        userId,
        { 
          subscriptionId: savedSubscription.id,
          plan: savedSubscription.plan,
          status: savedSubscription.status,
          startDate: savedSubscription.startDate,
          endDate: savedSubscription.endDate
        },
        'SubscriptionsService'
      );

      return savedSubscription;
    } catch (error) {
      this.logger.logServiceError(
        'CREATE',
        'Subscription',
        error as Error,
        requestId,
        userId,
        'SubscriptionsService'
      );
      throw error;
    }
  }

  async getUserSubscription(userId: string, requestId?: string) {
    this.logger.logServiceOperation(
      'FIND_USER_SUBSCRIPTION',
      'Subscription',
      requestId,
      userId,
      {},
      'SubscriptionsService'
    );

    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { userId, status: SubscriptionStatus.ACTIVE },
      });

      if (!subscription) {
        this.logger.logServiceOperation(
          'FIND_USER_SUBSCRIPTION_NOT_FOUND',
          'Subscription',
          requestId,
          userId,
          {},
          'SubscriptionsService'
        );
        throw new NotFoundException('No active subscription found');
      }

      this.logger.logServiceOperation(
        'FIND_USER_SUBSCRIPTION_SUCCESS',
        'Subscription',
        requestId,
        userId,
        { 
          subscriptionId: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        },
        'SubscriptionsService'
      );

      return subscription;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'FIND_USER_SUBSCRIPTION',
        'Subscription',
        error as Error,
        requestId,
        userId,
        'SubscriptionsService'
      );
      throw error;
    }
  }

  async cancelSubscription(userId: string, requestId?: string) {
    this.logger.logServiceOperation(
      'CANCEL',
      'Subscription',
      requestId,
      userId,
      {},
      'SubscriptionsService'
    );

    try {
      const subscription = await this.getUserSubscription(userId, requestId);
      subscription.status = SubscriptionStatus.CANCELLED;
      const cancelledSubscription = await this.subscriptionRepository.save(subscription);
      
      this.logger.logServiceOperation(
        'CANCEL_SUCCESS',
        'Subscription',
        requestId,
        userId,
        { 
          subscriptionId: cancelledSubscription.id,
          plan: cancelledSubscription.plan,
          status: cancelledSubscription.status
        },
        'SubscriptionsService'
      );

      return cancelledSubscription;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'CANCEL',
        'Subscription',
        error as Error,
        requestId,
        userId,
        'SubscriptionsService'
      );
      throw error;
    }
  }
}
