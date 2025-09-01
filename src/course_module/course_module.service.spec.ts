import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseModuleService } from './course_module.service';
import { CourseModule } from './module.entity';
import { CourseModulePdf } from './entities/course-module-pdf.entity';
import { AppLoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('CourseModuleService - PDF Operations', () => {
  let service: CourseModuleService;
  let moduleRepository: Repository<CourseModule>;
  let pdfRepository: Repository<CourseModulePdf>;
  let logger: AppLoggerService;

  const mockModuleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockPdfRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockLogger = {
    logServiceOperation: jest.fn(),
    logServiceError: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    role: 'program_admin',
  };

  const mockFile = {
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('mock pdf content'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseModuleService,
        {
          provide: getRepositoryToken(CourseModule),
          useValue: mockModuleRepository,
        },
        {
          provide: getRepositoryToken(CourseModulePdf),
          useValue: mockPdfRepository,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CourseModuleService>(CourseModuleService);
    moduleRepository = module.get<Repository<CourseModule>>(getRepositoryToken(CourseModule));
    pdfRepository = module.get<Repository<CourseModulePdf>>(getRepositoryToken(CourseModulePdf));
    logger = module.get<AppLoggerService>(AppLoggerService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('uploadPdf', () => {
    it('should upload PDF successfully', async () => {
      const courseModuleId = 'module-123';
      const mockCourseModule = { id: courseModuleId, title: 'Test Module' };
      const mockSavedPdf = {
        id: 'pdf-123',
        courseModuleId,
        fileName: 'test.pdf',
        filePath: '/uploads/courses/module-123/test.pdf',
        uploadedBy: mockUser.id,
      };

      mockModuleRepository.findOne.mockResolvedValue(mockCourseModule);
      mockPdfRepository.create.mockReturnValue(mockSavedPdf);
      mockPdfRepository.save.mockResolvedValue(mockSavedPdf);
      
      // Mock fs operations
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await service.uploadPdf(courseModuleId, mockFile, mockUser as any, 'req-123');

      expect(result).toEqual(mockSavedPdf);
      expect(mockModuleRepository.findOne).toHaveBeenCalledWith({ where: { id: courseModuleId } });
      expect(mockPdfRepository.save).toHaveBeenCalled();
      expect(mockLogger.logServiceOperation).toHaveBeenCalledWith(
        'UPLOAD_PDF_SUCCESS',
        'CourseModulePdf',
        'req-123',
        mockUser.id,
        expect.any(Object),
        'CourseModuleService'
      );
    });

    it('should throw NotFoundException if course module not found', async () => {
      mockModuleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.uploadPdf('invalid-id', mockFile, mockUser as any, 'req-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'image/jpeg' };
      mockModuleRepository.findOne.mockResolvedValue({ id: 'module-123' });

      await expect(
        service.uploadPdf('module-123', invalidFile, mockUser as any, 'req-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 }; // 15MB
      mockModuleRepository.findOne.mockResolvedValue({ id: 'module-123' });

      await expect(
        service.uploadPdf('module-123', largeFile, mockUser as any, 'req-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPdfsForModule', () => {
    it('should return PDFs for a module', async () => {
      const courseModuleId = 'module-123';
      const mockPdfs = [
        { id: 'pdf-1', fileName: 'file1.pdf', courseModuleId },
        { id: 'pdf-2', fileName: 'file2.pdf', courseModuleId },
      ];

      mockPdfRepository.find.mockResolvedValue(mockPdfs);

      const result = await service.getPdfsForModule(courseModuleId, 'req-123', 'user-123');

      expect(result).toEqual(mockPdfs);
      expect(mockPdfRepository.find).toHaveBeenCalledWith({
        where: { courseModuleId },
        order: { uploadedAt: 'DESC' }
      });
    });
  });

  describe('streamPdfContent', () => {
    it('should return PDF buffer for streaming', async () => {
      const pdfId = 'pdf-123';
      const mockPdf = {
        id: pdfId,
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf'
      };
      const mockBuffer = Buffer.from('pdf content');

      mockPdfRepository.findOne.mockResolvedValue(mockPdf);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await service.streamPdfContent(pdfId, 'req-123', 'user-123');

      expect(result).toEqual(mockBuffer);
      expect(fs.existsSync).toHaveBeenCalledWith(mockPdf.filePath);
    });

    it('should throw NotFoundException if PDF not found', async () => {
      mockPdfRepository.findOne.mockResolvedValue(null);

      await expect(
        service.streamPdfContent('invalid-id', 'req-123', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadPdf', () => {
    it('should return PDF buffer and metadata for download', async () => {
      const pdfId = 'pdf-123';
      const mockPdf = {
        id: pdfId,
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf'
      };
      const mockBuffer = Buffer.from('pdf content');

      mockPdfRepository.findOne.mockResolvedValue(mockPdf);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await service.downloadPdf(pdfId, 'req-123', 'user-123');

      expect(result).toEqual({ buffer: mockBuffer, pdf: mockPdf });
    });
  });

  describe('deletePdf', () => {
    it('should delete PDF successfully', async () => {
      const pdfId = 'pdf-123';
      const mockPdf = {
        id: pdfId,
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf'
      };

      mockPdfRepository.findOne.mockResolvedValue(mockPdf);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      mockPdfRepository.remove.mockResolvedValue(mockPdf);

      const result = await service.deletePdf(pdfId, mockUser as any, 'req-123');

      expect(result).toEqual({ message: 'PDF deleted successfully' });
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockPdf.filePath);
      expect(mockPdfRepository.remove).toHaveBeenCalledWith(mockPdf);
    });
  });
});
