import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UniversitiesModule } from './universities/universities.module';
import { ProgramsModule } from './programs/programs.module';
import { CoursesModule } from './courses/courses.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModule } from './department/department.module';
import { UsersProfileModule } from './user_profile/user_profile.module';
import { CourseModuleController } from './course_module/course_module.controller';
import { CourseModuleService } from './course_module/course_module.service';
import { CourseModuleModule } from './course_module/course_module.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

@Module({
  imports: [TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mongodb786',
      database: 'unisphere',
      autoLoadEntities: true,
      synchronize: true,
      migrations: ['src/migrations/*.ts'],

      // logging: true, // Enable logging for debugging
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
    UniversitiesModule,
    DepartmentModule,
    ProgramsModule,
    CoursesModule,
    CourseModuleModule,
    ContactUsModule,
    SubscriptionsModule,
    UsersProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
