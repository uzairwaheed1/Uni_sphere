import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  HttpCode, 
  HttpStatus,
  UseInterceptors 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ContactUsService } from './contact-us.service';
import { ContactUsDto } from './dto/contact-us.dto';
import { AppLoggerService } from '../common/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
  constructor(
    private readonly contactUsService: ContactUsService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Submit contact form',
    description: 'Submit a contact form with name, email, and query. Rate limited to 3 requests per day per IP address.'
  })
  @ApiBody({ type: ContactUsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Contact form submitted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Your message has been sent successfully. We will get back to you soon!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too Many Requests - Rate limit exceeded (max 3 per day)' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal Server Error - Failed to send message' 
  })
  async submitContactForm(
    @Body() contactData: ContactUsDto,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    const requestId = uuidv4();
    const clientIp = this.getClientIp(request);

    this.logger.logServiceOperation(
      'ContactUs',
      'Request Received',
      requestId,
      undefined,
      {
        userIp: clientIp,
        userEmail: contactData.email,
        userName: contactData.name,
      },
      'ContactUsController',
    );

    return await this.contactUsService.submitContactForm(
      contactData,
      clientIp,
      requestId,
    );
  }

  private getClientIp(request: Request): string {
    // Get client IP from various possible headers
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const clientIp = request.headers['x-client-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (clientIp) {
      return clientIp;
    }
    
    return request.connection.remoteAddress || 
           request.socket.remoteAddress || 
           '127.0.0.1';
  }
}
