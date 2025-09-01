import { Controller, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersProfileService } from './user_profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppLoggerService } from '../common/logger/logger.service';
@ApiTags('User Profiles')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersProfileController {
  constructor(
    private readonly usersService: UsersProfileService,
    private readonly logger: AppLoggerService,
  ) {}

@Get('get-profile/:id')
  @ApiOperation({ summary: 'Get user profile', description: 'Retrieves a user profile by user ID' })
  @ApiResponse({ status: 200, description: 'Profile successfully retrieved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Param('id') id: string, @Request() req) {
    const requestId = req.headers['x-request-id'];
    const currentUserId = req.user?.id;
    
    this.logger.info('GET /users/get-profile/:id accessed', {
      requestId,
      userId: currentUserId,
      userRoles: req.user?.roles,
      targetUserId: id,
    });

    return this.usersService.getProfileByUserId(id, requestId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile', description: 'Updates the profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateProfile(@Request() req, @Body() updateDto: UpdateUserProfileDto) {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    
    this.logger.info('PUT /users/profile accessed', {
      requestId,
      userId,
      userRoles: req.user?.roles,
      updateFields: Object.keys(updateDto),
    });

    return this.usersService.updateProfile(req.user.id, updateDto, requestId);
  }
}
