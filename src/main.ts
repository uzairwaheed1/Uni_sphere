import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createWinstonLogger } from './config/logger.config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('UniSphere API')
    .setDescription('The UniSphere API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User operations')
    .addTag('universities', 'University operations')
    .addTag('departments', 'Department operations')
    .addTag('programs', 'Program operations')
    .addTag('courses', 'Course operations')
    .addTag('modules', 'Course Module operations')
    .addTag('subscriptions', 'Subscription operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const logger = app.get('winston');
  await app.listen(3000);
  logger.info('UniSphere Backend started on port 3000', { context: 'Bootstrap' });

}
bootstrap();
