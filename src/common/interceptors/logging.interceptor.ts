import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, user, requestId } = request;
    const startTime = Date.now();

    // Enhanced request logging with user context and requestId
    this.logger.logWithMeta(
      'info',
      `HTTP Request Started`,
      {
        requestId,
        method,
        url,
        userId: user?.id,
        userRole: user?.role,
        userEmail: user?.email,
        body: method !== 'GET' && body ? this.sanitizeBody(body) : undefined,
        query: Object.keys(query || {}).length ? query : undefined,
        params: Object.keys(params || {}).length ? params : undefined,
        userAgent: request.headers['user-agent'],
        ip: request.ip || request.connection?.remoteAddress,
      },
      'HTTP'
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          this.logger.logWithMeta(
            'info',
            `HTTP Request Completed`,
            {
              requestId,
              method,
              url,
              statusCode: response.statusCode,
              responseTime,
              userId: user?.id,
              userRole: user?.role,
              responseSize: JSON.stringify(data || {}).length,
            },
            'HTTP'
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.logWithMeta(
            'error',
            `HTTP Request Failed`,
            {
              requestId,
              method,
              url,
              statusCode: response.statusCode || 500,
              responseTime,
              userId: user?.id,
              userRole: user?.role,
              error: error.message,
              stack: error.stack,
            },
            'HTTP'
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
