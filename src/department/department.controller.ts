import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('department')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post('create-department')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get('all-departments')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'Returns all departments.' })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get('find-department/:id')
  @ApiOperation({ summary: 'Find department by ID' })
  @ApiResponse({ status: 200, description: 'Returns the found department.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Put('update-department/:id')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department has been successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete('delete-department/:id')
  @Roles('super_admin', 'university_admin')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: 'Department has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
