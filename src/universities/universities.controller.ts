import { Controller, Get, Post, Body, Param, Patch, Delete, Request } from '@nestjs/common';
import { UniversityService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/users.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppLoggerService } from '../common/logger/logger.service';

@ApiTags('Universities')
@ApiBearerAuth()
@Controller('universities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UniversityController {
  constructor(
    private readonly universityService: UniversityService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('create-university')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new university', description: 'Creates a new university (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'University successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  create(@Body() dto: CreateUniversityDto, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'University creation endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        universityName: dto.name,
      },
      'UniversityController'
    );

    return this.universityService.create(dto, requestId, user?.id);
  }

  @Get('all-universities')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all universities', description: 'Retrieves all universities (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all universities' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  findAll(@Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Get all universities endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
      },
      'UniversityController'
    );

    return this.universityService.findAll(requestId, user?.id);
  }

  @Get('find-university/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Find university by ID', description: 'Get university details by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'University found' })
  @ApiResponse({ status: 404, description: 'University not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  findOne(@Param('id') id: string, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Get university by ID endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        universityId: id,
      },
      'UniversityController'
    );

    return this.universityService.findOne(id, requestId, user?.id);
  }

  @Patch('update-university/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update university', description: 'Updates university details (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'University successfully updated' })
  @ApiResponse({ status: 404, description: 'University not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  update(@Param('id') id: string, @Body() dto: UpdateUniversityDto, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Update university endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        universityId: id,
        updateFields: Object.keys(dto),
      },
      'UniversityController'
    );

    return this.universityService.update(id, dto, requestId, user?.id);
  }

  @Delete('delete-university/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete university', description: 'Deletes a university (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'University successfully deleted' })
  @ApiResponse({ status: 404, description: 'University not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  remove(@Param('id') id: string, @Request() req) {
    const { requestId, user } = req;
    
    this.logger.logWithMeta(
      'info',
      'Delete university endpoint accessed',
      {
        requestId,
        userId: user?.id,
        userRole: user?.role,
        universityId: id,
      },
      'UniversityController'
    );

    return this.universityService.remove(id, requestId, user?.id);
  }
}
