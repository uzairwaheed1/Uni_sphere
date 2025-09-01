import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AppLoggerService } from '../common/logger/logger.service';
import { ContactUsDto } from './dto/contact-us.dto';
import { ContactRequest } from './entities/contact-request.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ContactUsService {
  private readonly MAX_REQUESTS_PER_DAY = 3;

  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRequestRepository: Repository<ContactRequest>,
    private readonly logger: AppLoggerService,
  ) {}

  async submitContactForm(
    contactData: ContactUsDto,
    clientIp: string,
    requestId?: string,
  ): Promise<{ message: string }> {
    // Check database-backed rate limiting
    await this.checkRateLimit(clientIp);

    // Log the request
    this.logger.logServiceOperation(
      'ContactUs',
      'Form Submission',
      requestId,
      undefined,
      {
        userIp: clientIp,
        userEmail: contactData.email,
        userName: contactData.name,
      },
      'ContactUsService',
    );

    try {
      // Save contact request to database for rate limiting
      await this.saveContactRequest(clientIp);

      // Send email
      await this.sendContactEmail(contactData);

      this.logger.info('Contact form submitted successfully', {
        context: 'ContactUsService',
        requestId,
        userIp: clientIp,
        userEmail: contactData.email,
      });

      return { message: 'Your message has been sent successfully. We will get back to you soon!' };
    } catch (error) {
      this.logger.logServiceError(
        'ContactUs',
        'Form Submission',
        error,
        requestId,
        undefined,
        'ContactUsService',
      );
      throw new HttpException(
        'Failed to send your message. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get today's midnight timestamp (00:00:00)
   */
  private getTodayMidnight(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Check database-backed rate limiting
   */
  private async checkRateLimit(clientIp: string): Promise<void> {
    const todayMidnight = this.getTodayMidnight();
    
    // Query database for requests from this IP since midnight
    const requestCount = await this.contactRequestRepository.count({
      where: {
        ip: clientIp,
        createdAt: MoreThanOrEqual(todayMidnight),
      },
    });

    if (requestCount >= this.MAX_REQUESTS_PER_DAY) {
      this.logger.warn('Rate limit exceeded for contact form', {
        context: 'ContactUsService',
        userIp: clientIp,
        requestCount,
        maxRequests: this.MAX_REQUESTS_PER_DAY,
      });

      throw new BadRequestException(
        'Rate limit exceeded. Try again tomorrow.'
      );
    }

    this.logger.debug('Rate limit check passed', {
      context: 'ContactUsService',
      userIp: clientIp,
      currentCount: requestCount,
      maxRequests: this.MAX_REQUESTS_PER_DAY,
    });
  }

  /**
   * Save contact request to database for rate limiting tracking
   */
  private async saveContactRequest(clientIp: string): Promise<void> {
    const contactRequest = this.contactRequestRepository.create({
      ip: clientIp,
    });

    await this.contactRequestRepository.save(contactRequest);

    this.logger.debug('Contact request saved for rate limiting', {
      context: 'ContactUsService',
      userIp: clientIp,
    });
  }

  private async sendContactEmail(contactData: ContactUsDto): Promise<void> {
    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'uzairw227@gmail.com',
        pass: process.env.SMTP_PASS || 'viqlfrlowztsptcn',
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@unisphere.com',
      to: process.env.CONTACT_EMAIL || 'uzairwaheedadamjee26@gmail.com',
      subject: `New Contact Form Submission from ${contactData.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.query.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent from the UniSphere contact form.</em></p>
      `,
    };

    // Send the actual email
    await transporter.sendMail(mailOptions);
    
    this.logger.info('Email sent successfully:', {
      context: 'ContactUsService',
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      senderName: contactData.name,
      senderEmail: contactData.email,
    });
  }

}
