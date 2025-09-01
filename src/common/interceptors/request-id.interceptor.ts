import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Generate unique request ID
    const requestId = uuidv4();
    
    // Attach requestId to request object for use in other interceptors/guards/services
    request.requestId = requestId;
    
    // Add requestId to response headers for client-side tracking
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Request-ID', requestId);
    
    return next.handle();
  }
}
