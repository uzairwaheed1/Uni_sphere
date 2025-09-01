import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: any, context?: Object) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: Object) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: any, context?: Object) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: Object) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: Object) {
    this.logger.verbose(message, { context });
  }

  // Additional convenience methods
  info(message: any, context?: Object) {
    this.logger.info(message, { context });
  }

  // Method for structured logging with additional metadata
  logWithMeta(level: string, message: string, meta: object, context?: string) {
    this.logger.log(level, message, { context, ...meta });
  }

  // Method for service operation logging with requestId and userId
  logServiceOperation(
    operation: string,
    entity: string,
    requestId?: string,
    userId?: string,
    additionalMeta?: object,
    context?: string
  ) {
    this.logger.info(`${operation} ${entity}`, {
      context: context || 'Service',
      operation,
      entity,
      requestId,
      userId,
      ...additionalMeta,
    });
  }

  // Method for service error logging
  logServiceError(
    operation: string,
    entity: string,
    error: Error,
    requestId?: string,
    userId?: string,
    context?: string
  ) {
    this.logger.error(`${operation} ${entity} failed: ${error.message}`, {
      context: context || 'Service',
      operation,
      entity,
      requestId,
      userId,
      error: error.message,
      stack: error.stack,
    });
  }

  // Method for API request logging
  logRequest(method: string, url: string, statusCode: number, responseTime: number, context?: string) {
    this.logger.info(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      context: context || 'HTTP',
      method,
      url,
      statusCode,
      responseTime,
    });
  }

  // Method for database operation logging
  logDbOperation(operation: string, table: string, duration: number, context?: string) {
    this.logger.info(`DB ${operation} on ${table} completed in ${duration}ms`, {
      context: context || 'Database',
      operation,
      table,
      duration,
    });
  }
}
