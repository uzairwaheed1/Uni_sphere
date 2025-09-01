import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from './module.entity';
import { CourseModulePdf } from './entities/course-module-pdf.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { User } from '../auth/users.entity';
import { AppLoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as pdf from 'pdf-parse';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class CourseModuleService {
  constructor(
    @InjectRepository(CourseModule)
    private moduleRepository: Repository<CourseModule>,
    @InjectRepository(CourseModulePdf)
    private pdfRepository: Repository<CourseModulePdf>,
    private readonly logger: AppLoggerService,
  ) {}

  async createModule(createModuleDto: CreateModuleDto, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'CREATE',
      'CourseModule',
      requestId,
      user?.id,
      { 
        courseId: createModuleDto.courseId,
        moduleName: createModuleDto.title 
      },
      'CourseModuleService'
    );

    try {
      const module = this.moduleRepository.create(createModuleDto);
      const savedModule = await this.moduleRepository.save(module);
      
      this.logger.logServiceOperation(
        'CREATE_SUCCESS',
        'CourseModule',
        requestId,
        user?.id,
        { 
          moduleId: savedModule.id,
          courseId: savedModule.courseId,
          moduleName: savedModule.title 
        },
        'CourseModuleService'
      );

      return savedModule;
    } catch (error) {
      this.logger.logServiceError(
        'CREATE',
        'CourseModule',
        error as Error,
        requestId,
        user?.id,
        'CourseModuleService'
      );
      throw error;
    }
  }

  async getModulesByCourseId(courseId: string, requestId?: string, userId?: string) {
    this.logger.logServiceOperation(
      'FIND_BY_COURSE',
      'CourseModule',
      requestId,
      userId,
      { courseId },
      'CourseModuleService'
    );

    try {
      const modules = await this.moduleRepository.find({
        where: { courseId },
        order: {
          createdAt: 'ASC',
        },
      });
      
      this.logger.logServiceOperation(
        'FIND_BY_COURSE_SUCCESS',
        'CourseModule',
        requestId,
        userId,
        { 
          courseId,
          moduleCount: modules.length 
        },
        'CourseModuleService'
      );

      return modules;
    } catch (error) {
      this.logger.logServiceError(
        'FIND_BY_COURSE',
        'CourseModule',
        error as Error,
        requestId,
        userId,
        'CourseModuleService'
      );
      throw error;
    }
  }

  async updateModule(id: string, updateModuleDto: Partial<CreateModuleDto>, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'UPDATE',
      'CourseModule',
      requestId,
      user?.id,
      { 
        moduleId: id,
        updateFields: Object.keys(updateModuleDto)
      },
      'CourseModuleService'
    );

    try {
      const module = await this.moduleRepository.findOne({
        where: { id },
        relations: ['course'],
      });

      if (!module) {
        this.logger.logServiceOperation(
          'UPDATE_NOT_FOUND',
          'CourseModule',
          requestId,
          user?.id,
          { moduleId: id },
          'CourseModuleService'
        );
        throw new NotFoundException('Module not found');
      }

      Object.assign(module, updateModuleDto);
      const updatedModule = await this.moduleRepository.save(module);
      
      this.logger.logServiceOperation(
        'UPDATE_SUCCESS',
        'CourseModule',
        requestId,
        user?.id,
        { 
          moduleId: updatedModule.id,
          moduleName: updatedModule.title,
          courseId: updatedModule.courseId
        },
        'CourseModuleService'
      );

      return updatedModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'UPDATE',
        'CourseModule',
        error as Error,
        requestId,
        user?.id,
        'CourseModuleService'
      );
      throw error;
    }
  }

  async deleteModule(id: string, user: User, requestId?: string) {
    this.logger.logServiceOperation(
      'DELETE',
      'CourseModule',
      requestId,
      user?.id,
      { moduleId: id },
      'CourseModuleService'
    );

    try {
      const module = await this.moduleRepository.findOne({
        where: { id },
        relations: ['course'],
      });

      if (!module) {
        this.logger.logServiceOperation(
          'DELETE_NOT_FOUND',
          'CourseModule',
          requestId,
          user?.id,
          { moduleId: id },
          'CourseModuleService'
        );
        throw new NotFoundException('Module not found');
      }

      await this.moduleRepository.remove(module);
      
      this.logger.logServiceOperation(
        'DELETE_SUCCESS',
        'CourseModule',
        requestId,
        user?.id,
        { 
          moduleId: id,
          moduleName: module.title,
          courseId: module.courseId
        },
        'CourseModuleService'
      );

      return { message: 'Module deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.logServiceError(
        'DELETE',
        'CourseModule',
        error as Error,
        requestId,
        user?.id,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // PDF Upload functionality
  async uploadPdf(
    courseModuleId: string,
    file: any,
    user: User,
    requestId?: string
  ): Promise<CourseModulePdf> {
    this.logger.logServiceOperation(
      'UPLOAD_PDF',
      'CourseModulePdf',
      requestId,
      user?.id,
      { 
        courseModuleId,
        fileName: file.originalname,
        fileSize: file.size
      },
      'CourseModuleService'
    );

    try {
      // Verify course module exists
      const courseModule = await this.moduleRepository.findOne({
        where: { id: courseModuleId }
      });

      if (!courseModule) {
        throw new NotFoundException('Course module not found');
      }

      // Validate file type and size
      this.validatePdfFile(file);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'courses', courseModuleId);
      await this.ensureDirectoryExists(uploadsDir);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      await writeFile(filePath, file.buffer);

      // Save PDF metadata to database
      const pdfRecord = this.pdfRepository.create({
        courseModuleId,
        fileName: file.originalname,
        filePath,
        uploadedBy: user.id,
        fileSize: file.size,
        mimeType: file.mimetype
      });

      const savedPdf = await this.pdfRepository.save(pdfRecord);

      this.logger.logServiceOperation(
        'UPLOAD_PDF_SUCCESS',
        'CourseModulePdf',
        requestId,
        user?.id,
        { 
          pdfId: savedPdf.id,
          courseModuleId,
          fileName: savedPdf.fileName,
          filePath: savedPdf.filePath
        },
        'CourseModuleService'
      );

      console.log(pdfRecord);
      console.log(savedPdf);

      return savedPdf;
    } catch (error) {
      this.logger.logServiceError(
        'UPLOAD_PDF',
        'CourseModulePdf',
        error as Error,
        requestId,
        user?.id,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // Get PDF metadata for a course module
  async getPdfsForModule(courseModuleId: string, requestId?: string, userId?: string): Promise<CourseModulePdf[]> {
    this.logger.logServiceOperation(
      'GET_PDFS',
      'CourseModulePdf',
      requestId,
      userId,
      { courseModuleId },
      'CourseModuleService'
    );

    try {
      const pdfs = await this.pdfRepository.find({
        where: { courseModuleId },
        order: { uploadedAt: 'DESC' }
      });

      this.logger.logServiceOperation(
        'GET_PDFS_SUCCESS',
        'CourseModulePdf',
        requestId,
        userId,
        { 
          courseModuleId,
          pdfCount: pdfs.length
        },
        'CourseModuleService'
      );

      return pdfs;
    } catch (error) {
      this.logger.logServiceError(
        'GET_PDFS',
        'CourseModulePdf',
        error as Error,
        requestId,
        userId,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // Stream PDF content as readable text
  async streamPdfContent(pdfId: string, requestId?: string, userId?: string): Promise<string> {
    this.logger.logServiceOperation(
      'STREAM_PDF',
      'CourseModulePdf',
      requestId,
      userId,
      { pdfId },
      'CourseModuleService'
    );

    try {
      const pdfRecord = await this.pdfRepository.findOne({
        where: { id: pdfId }
      });

      if (!pdfRecord) {
        throw new NotFoundException('PDF not found');
      }

      // Check if file exists
      if (!fs.existsSync(pdfRecord.filePath)) {
        throw new NotFoundException('PDF file not found on disk');
      }

      // Read file content
      const fileBuffer = await readFile(pdfRecord.filePath);

      // Extract text from PDF
      const pdfData = await pdf(fileBuffer);
      const extractedText = pdfData.text;

      this.logger.logServiceOperation(
        'STREAM_PDF_SUCCESS',
        'CourseModulePdf',
        requestId,
        userId,
        { 
          pdfId,
          fileName: pdfRecord.fileName,
          textLength: extractedText.length,
          pageCount: pdfData.numpages
        },
        'CourseModuleService'
      );

      return extractedText;
    } catch (error) {
      this.logger.logServiceError(
        'STREAM_PDF',
        'CourseModulePdf',
        error as Error,
        requestId,
        userId,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // Download PDF
  async downloadPdf(pdfId: string, requestId?: string, userId?: string): Promise<{ buffer: Buffer; pdf: CourseModulePdf }> {
    this.logger.logServiceOperation(
      'DOWNLOAD_PDF',
      'CourseModulePdf',
      requestId,
      userId,
      { pdfId },
      'CourseModuleService'
    );

    try {
      const pdf = await this.pdfRepository.findOne({
        where: { id: pdfId }
      });

      if (!pdf) {
        throw new NotFoundException('PDF not found');
      }

      // Check if file exists
      if (!fs.existsSync(pdf.filePath)) {
        throw new NotFoundException('PDF file not found on disk');
      }

      // Read file content
      const fileBuffer = await readFile(pdf.filePath);

      this.logger.logServiceOperation(
        'DOWNLOAD_PDF_SUCCESS',
        'CourseModulePdf',
        requestId,
        userId,
        { 
          pdfId,
          fileName: pdf.fileName,
          fileSize: fileBuffer.length
        },
        'CourseModuleService'
      );

      return { buffer: fileBuffer, pdf };
    } catch (error) {
      this.logger.logServiceError(
        'DOWNLOAD_PDF',
        'CourseModulePdf',
        error as Error,
        requestId,
        userId,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // Delete PDF
  async deletePdf(pdfId: string, user: User, requestId?: string): Promise<{ message: string }> {
    this.logger.logServiceOperation(
      'DELETE_PDF',
      'CourseModulePdf',
      requestId,
      user?.id,
      { pdfId },
      'CourseModuleService'
    );

    try {
      const pdf = await this.pdfRepository.findOne({
        where: { id: pdfId }
      });

      if (!pdf) {
        throw new NotFoundException('PDF not found');
      }

      // Delete file from disk if it exists
      if (fs.existsSync(pdf.filePath)) {
        fs.unlinkSync(pdf.filePath);
      }

      // Delete record from database
      await this.pdfRepository.remove(pdf);

      this.logger.logServiceOperation(
        'DELETE_PDF_SUCCESS',
        'CourseModulePdf',
        requestId,
        user?.id,
        { 
          pdfId,
          fileName: pdf.fileName
        },
        'CourseModuleService'
      );

      return { message: 'PDF deleted successfully' };
    } catch (error) {
      this.logger.logServiceError(
        'DELETE_PDF',
        'CourseModulePdf',
        error as Error,
        requestId,
        user?.id,
        'CourseModuleService'
      );
      throw error;
    }
  }

  // Helper methods
  private validatePdfFile(file: any): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = ['application/pdf'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
}