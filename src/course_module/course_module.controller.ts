import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  UseInterceptors, 
  UploadedFile, 
  Res, 
  Sse, 
  MessageEvent 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable, interval, map, take, concat, of } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CourseModuleService } from './course_module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateCourseModuleDto } from './dto/update_course_module.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@ApiTags('modules')
@ApiBearerAuth()
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseModuleController {
  constructor(
    private readonly modulesService: CourseModuleService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('create-module')
  @Roles('program_admin')
  @ApiOperation({ summary: 'Create a new course module' })
  @ApiResponse({ status: 201, description: 'Module has been created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only program admins can create modules.' })
  create(@Body() createModuleDto: CreateModuleDto, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Course module creation endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseId: createModuleDto.courseId,
        moduleTitle: createModuleDto.title,
      },
      'CourseModuleController'
    );

    return this.modulesService.createModule(createModuleDto, user, requestId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all modules for a course' })
  @ApiResponse({ status: 200, description: 'Return all modules for the specified course.' })
  getModulesByCourse(@Param('courseId') courseId: string, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Get modules by course endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseId,
      },
      'CourseModuleController'
    );

    return this.modulesService.getModulesByCourseId(courseId, requestId, user?.id);
  }

  @Put('update/:id')
  @Roles('program_admin')
  @ApiOperation({ summary: 'Update a module' })
  @ApiResponse({ status: 200, description: 'Module has been updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only program admins can update modules.' })
  update(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateCourseModuleDto,
    @Request() req
  ) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Update course module endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        moduleId: id,
        updateFields: Object.keys(updateModuleDto),
      },
      'CourseModuleController'
    );

    return this.modulesService.updateModule(id, updateModuleDto, user, requestId);
  }

  @Delete(':id')
  @Roles('program_admin')
  @ApiOperation({ summary: 'Delete a module' })
  @ApiResponse({ status: 200, description: 'Module has been deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only program admins can delete modules.' })
  remove(@Param('id') id: string, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Delete course module endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        moduleId: id,
      },
      'CourseModuleController'
    );

    return this.modulesService.deleteModule(id, user, requestId);
  }

  // PDF Upload endpoint
  @Post(':id/upload')
  @Roles('program_admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF to course module' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }, // this makes Swagger show the file chooser
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'PDF uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only program admins can upload PDFs.' })
  @ApiResponse({ status: 404, description: 'Course module not found.' })
  async uploadPdf(
    @Param('id') courseModuleId: string,
    @UploadedFile() file: any,
    @Request() req
  ) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'PDF upload endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseModuleId,
        fileName: file?.originalname,
        fileSize: file?.size,
      },
      'CourseModuleController'
    );

    return this.modulesService.uploadPdf(courseModuleId, file, user, requestId);
  }

  // Get PDFs for a module
  @Get(':id/pdfs')
  @ApiOperation({ summary: 'Get all PDFs for a course module' })
  @ApiResponse({ status: 200, description: 'Return all PDFs for the specified module.' })
  @ApiResponse({ status: 404, description: 'Course module not found.' })
  async getPdfsForModule(@Param('id') courseModuleId: string, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Get PDFs for module endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseModuleId,
      },
      'CourseModuleController'
    );

    return this.modulesService.getPdfsForModule(courseModuleId, requestId, user?.id);
  }

  // Stream PDF content as chunked response
  @Get(':id/stream/:pdfId')
  @ApiOperation({ summary: 'Stream PDF content as chunked JSON response' })
  @ApiResponse({ status: 200, description: 'PDF content streamed successfully.' })
  @ApiResponse({ status: 404, description: 'PDF not found.' })
  async streamPdf(
    @Param('id') courseModuleId: string,
    @Param('pdfId') pdfId: string,
    @Res() res: Response,
    @Request() req
  ) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'PDF streaming endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseModuleId,
        pdfId,
      },
      'CourseModuleController'
    );

    try {
      const extractedText = await this.modulesService.streamPdfContent(pdfId, requestId, user?.id);
      
      // Set headers for chunked transfer
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Split text into readable chunks (by sentences or paragraphs)
      const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const chunkSize = 5; // 5 sentences per chunk
      const totalChunks = Math.ceil(sentences.length / chunkSize);

      // Send initial metadata
      res.write(JSON.stringify({
        type: 'start',
        totalChunks,
        totalSentences: sentences.length,
        textLength: extractedText.length
      }) + '\n');

      // Send text chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, sentences.length);
        const chunkSentences = sentences.slice(start, end);
        const chunkText = chunkSentences.join('. ').trim() + '.';
        
        const chunkData = JSON.stringify({
          type: 'chunk',
          text: chunkText,
          chunkIndex: i,
          totalChunks,
          sentenceCount: chunkSentences.length,
          isLast: i === totalChunks - 1
        }) + '\n';

        res.write(chunkData);
        
        // Small delay to make streaming visible
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Send completion event
      res.write(JSON.stringify({
        type: 'end',
        message: 'PDF text streaming completed',
        totalTextLength: extractedText.length
      }) + '\n');

      res.end();

      this.logger.logWithMeta(
        'info',
        'PDF streaming completed',
        {
          requestId,
          userId: user?.id,
          pdfId,
          totalChunks,
        },
        'CourseModuleController'
      );
    } catch (error) {
      res.status(500).json({
        type: 'error',
        message: error.message
      });
      
      this.logger.logWithMeta(
        'error',
        'PDF streaming failed',
        {
          requestId,
          userId: user?.id,
          pdfId,
          error: error.message,
        },
        'CourseModuleController'
      );
    }
  }

  // Download PDF
  @Get(':id/download/:pdfId')
  @ApiOperation({ summary: 'Download PDF file' })
  @ApiResponse({ status: 200, description: 'PDF downloaded successfully.' })
  @ApiResponse({ status: 404, description: 'PDF not found.' })
  async downloadPdf(
    @Param('id') courseModuleId: string,
    @Param('pdfId') pdfId: string,
    @Res() res: Response,
    @Request() req
  ) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'PDF download endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseModuleId,
        pdfId,
      },
      'CourseModuleController'
    );

    try {
      const { buffer, pdf } = await this.modulesService.downloadPdf(pdfId, requestId, user?.id);

      // Set proper headers for PDF download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.fileName}"`,
        'Content-Length': buffer.length.toString(),
      });

      this.logger.logWithMeta(
        'info',
        'PDF download completed',
        {
          requestId,
          userId: user?.id,
          pdfId,
          fileName: pdf.fileName,
          fileSize: buffer.length,
        },
        'CourseModuleController'
      );

      res.send(buffer);
    } catch (error) {
      this.logger.logWithMeta(
        'error',
        'PDF download failed',
        {
          requestId,
          userId: user?.id,
          pdfId,
          error: error.message,
        },
        'CourseModuleController'
      );
      throw error;
    }
  }

  // Delete PDF
  @Delete(':id/pdf/:pdfId')
  @Roles('program_admin')
  @ApiOperation({ summary: 'Delete PDF from course module' })
  @ApiResponse({ status: 200, description: 'PDF deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only program admins can delete PDFs.' })
  @ApiResponse({ status: 404, description: 'PDF not found.' })
  async deletePdf(
    @Param('id') courseModuleId: string,
    @Param('pdfId') pdfId: string,
    @Request() req
  ) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'PDF delete endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        courseModuleId,
        pdfId,
      },
      'CourseModuleController'
    );

    return this.modulesService.deletePdf(pdfId, user, requestId);
  }
}