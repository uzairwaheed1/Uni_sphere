import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from '../src/course_module/module.entity';
import { CourseModulePdf } from '../src/course_module/entities/course-module-pdf.entity';
import { User, Role } from '../src/auth/users.entity';
import * as fs from 'fs';
import * as path from 'path';

describe('CourseModule PDF Operations (e2e)', () => {
  let app: INestApplication;
  let moduleRepository: Repository<CourseModule>;
  let pdfRepository: Repository<CourseModulePdf>;
  let userRepository: Repository<User>;
  let authToken: string;
  let testModuleId: string;
  let testPdfId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    moduleRepository = app.get<Repository<CourseModule>>(getRepositoryToken(CourseModule));
    pdfRepository = app.get<Repository<CourseModulePdf>>(getRepositoryToken(CourseModulePdf));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test user with program_admin role
    const testUser = userRepository.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: Role.PROGRAM_ADMIN,
    });
    const savedUser = await userRepository.save(testUser);

    // Create test course module
    const testModule = moduleRepository.create({
      courseId: 'test-course-id',
      title: 'Test Module',
      content: 'Test content',
      moduleNumber: 1,
    });
    const savedModule = await moduleRepository.save(testModule);
    testModuleId = savedModule.id;

    // Get auth token (you'll need to implement this based on your auth system)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.access_token;
  }

  async function cleanupTestData() {
    // Clean up test files
    const uploadsDir = path.join(process.cwd(), 'uploads', 'courses', testModuleId);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }

    // Clean up database
    await pdfRepository.delete({});
    await moduleRepository.delete({});
    await userRepository.delete({});
  }

  describe('PDF Upload', () => {
    it('should upload PDF successfully', async () => {
      // Create a test PDF buffer
      const pdfBuffer = Buffer.from('%PDF-1.4 test content');
      
      const response = await request(app.getHttpServer())
        .post(`/modules/${testModuleId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fileName).toBe('test.pdf');
      expect(response.body.courseModuleId).toBe(testModuleId);
      
      testPdfId = response.body.id;
    });

    it('should reject non-PDF files', async () => {
      const txtBuffer = Buffer.from('This is not a PDF');
      
      await request(app.getHttpServer())
        .post(`/modules/${testModuleId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', txtBuffer, 'test.txt')
        .expect(400);
    });

    it('should reject files larger than 10MB', async () => {
      // Create a large buffer (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      await request(app.getHttpServer())
        .post(`/modules/${testModuleId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.pdf')
        .expect(400);
    });

    it('should require program_admin role', async () => {
      // Test without proper authorization
      const pdfBuffer = Buffer.from('%PDF-1.4 test content');
      
      await request(app.getHttpServer())
        .post(`/modules/${testModuleId}/upload`)
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(401);
    });
  });

  describe('PDF Listing', () => {
    it('should list PDFs for a module', async () => {
      const response = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/pdfs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('fileName');
      expect(response.body[0]).toHaveProperty('uploadedAt');
    });
  });

  describe('PDF Download', () => {
    it('should download PDF with proper headers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/download/${testPdfId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('test.pdf');
    });

    it('should return 404 for non-existent PDF', async () => {
      await request(app.getHttpServer())
        .get(`/modules/${testModuleId}/download/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PDF Deletion', () => {
    it('should delete PDF successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/modules/${testModuleId}/pdf/${testPdfId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('PDF deleted successfully');

      // Verify PDF is deleted from database
      const deletedPdf = await pdfRepository.findOne({ where: { id: testPdfId } });
      expect(deletedPdf).toBeNull();
    });

    it('should require program_admin role for deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/modules/${testModuleId}/pdf/${testPdfId}`)
        .expect(401);
    });
  });
});
