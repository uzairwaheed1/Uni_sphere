import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramService } from './programs.service';
import { CreateProgramDto } from './dto/create-programs.dto';
import { UpdateProgramDto } from './dto/update-programs.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AppLoggerService } from '../common/logger/logger.service';

@ApiTags('programs')
@ApiBearerAuth()
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramController {
  constructor(
    private readonly programService: ProgramService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('create-program')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Create a new program' })
  @ApiResponse({ status: 201, description: 'Program successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  create(@Body() dto: CreateProgramDto, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('POST /programs/create-program accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      universityId: dto.universityId,
      programName: dto.name,
    });

    return this.programService.create(dto, requestId, userId);
  }

  @Get('all-programs')
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Returns all programs.' })
  findAll(@Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('GET /programs/all-programs accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
    });

    return this.programService.findAll(requestId, userId);
  }

  @Get('find-program/:id')
  @ApiOperation({ summary: 'Find program by ID' })
  @ApiResponse({ status: 200, description: 'Returns the found program.' })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('GET /programs/find-program/:id accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      programId: id,
    });

    return this.programService.findOne(id, requestId, userId);
  }

  @Put('update-program/:id')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Update a program' })
  @ApiResponse({ status: 200, description: 'Program successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('PUT /programs/update-program/:id accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      programId: id,
      updateFields: Object.keys(dto),
    });

    return this.programService.update(id, dto, requestId, userId);
  }

  @Delete('delete-program/:id')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Delete a program' })
  @ApiResponse({ status: 200, description: 'Program successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Program not found.' })
  remove(@Param('id') id: string, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('DELETE /programs/delete-program/:id accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      programId: id,
    });

    return this.programService.remove(id, requestId, userId);
  }
}
