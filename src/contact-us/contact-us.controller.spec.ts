import { Test, TestingModule } from '@nestjs/testing';
import { ContactUsController } from './contact-us.controller';
import { ContactUsService } from './contact-us.service';
import { AppLoggerService } from '../common/logger/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ContactUsController', () => {
  let controller: ContactUsController;
  let service: ContactUsService;

  const mockContactUsService = {
    submitContactForm: jest.fn(),
  };

  const mockLoggerService = {
    logServiceOperation: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactUsController],
      providers: [
        {
          provide: ContactUsService,
          useValue: mockContactUsService,
        },
        {
          provide: AppLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<ContactUsController>(ContactUsController);
    service = module.get<ContactUsService>(ContactUsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit contact form successfully', async () => {
    const contactData = {
      name: 'John Doe',
      email: 'john@example.com',
      query: 'Test message',
    };

    const mockRequest = {
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const expectedResponse = { message: 'Your message has been sent successfully. We will get back to you soon!' };
    mockContactUsService.submitContactForm.mockResolvedValue(expectedResponse);

    const result = await controller.submitContactForm(contactData, mockRequest);

    expect(result).toEqual(expectedResponse);
    expect(mockContactUsService.submitContactForm).toHaveBeenCalledWith(
      contactData,
      '127.0.0.1',
      expect.any(String),
    );
  });
});
