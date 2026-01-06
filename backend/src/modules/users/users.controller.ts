import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  Request, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@/auth/decorate/customize';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Permissions } from '@/auth/decorate/permissions.decorator';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { UpdateRolePresetDto } from './dto/update-role-preset.dto';

import { CloudinaryService } from './cloudinary.service';

@ApiTags('Admin')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @Permissions('user:create')
  @Post('create-user')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @Permissions('user:view')
  @Get()
  findAll(
    @Query() query: any, 
    @Query('page') page: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? +page : 1;
    // Convert query object to string for aqp
    const queryString = new URLSearchParams(query as any).toString();
    return this.usersService.findAll(queryString, pageNum, search);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user._id || req.user.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile (for viewing by friends or own profile)' })
  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string, @Request() req: any) {
    const requestUserId = req.user._id || req.user.id;
    return this.usersService.getUserProfileForViewing(id, requestUserId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @Permissions('user:view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @Permissions('user:edit', 'user:edit-any')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @Permissions('user:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File không được tìm thấy');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, GIF, WEBP)');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 5MB');
    }

    const userId = req.user._id || req.user.id;
    return this.usersService.updateAvatar(userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('profile/cover-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCoverImage(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File không được tìm thấy');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, GIF, WEBP)');
    }

    // Validate file size (max 10MB for cover images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 10MB');
    }

    const userId = req.user._id || req.user.id;
    return this.usersService.updateCoverImage(userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload video to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('upload/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File không được tìm thấy');
    }

    // Validate file type
    const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI, WEBM)');
    }

    // Validate file size (max 500MB for videos)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 500MB');
    }

    try {
      const videoUrl = await this.cloudinaryService.uploadVideo(file, 'course-videos');
      return {
        video_url: videoUrl,
        message: 'Upload video thành công',
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new BadRequestException('Không thể upload video. Vui lòng thử lại.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @Patch('profile/password')
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user._id || req.user.id;
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role presets (Admin only)' })
  @Permissions('user:view')
  @Get('roles/presets')
  async getRolePresets() {
    return this.usersService.getRolePresets();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize role presets in database (Admin only)' })
  @Permissions('user:edit')
  @Post('roles/presets/initialize')
  async initializeRolePresets() {
    await this.usersService.initializeRolePresets();
    return { message: 'Role presets initialized successfully' };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role preset permissions (Admin only)' })
  @Permissions('user:edit')
  @Patch('roles/presets/:role')
  updateRolePreset(
    @Param('role') role: string,
    @Body() updateDto: UpdateRolePresetDto,
  ) {
    return this.usersService.updateRolePreset(role, updateDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get effective permissions of user (Admin only)' })
  @Permissions('user:view')
  @Get(':id/permissions')
  getPermissions(@Param('id') id: string) {
    return this.usersService.getPermissions(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permissions override for user (Admin only)' })
  @Permissions('user:edit')
  @Patch(':id/permissions')
  updatePermissions(@Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    return this.usersService.updatePermissions(id, dto.permissions);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend user account (Admin only)' })
  @Permissions('user:suspend')
  @Post(':id/suspend')
  suspendUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.usersService.suspendUser(id, body.reason);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate suspended user account (Admin only)' })
  @Permissions('user:activate')
  @Post(':id/activate')
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user activity log (Admin only)' })
  @Permissions('user:view')
  @Get(':id/activity')
  getUserActivity(@Param('id') id: string) {
    return this.usersService.getUserActivity(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin reset user password (Admin only)' })
  @Permissions('user:edit')
  @Patch(':id/reset-password')
  adminResetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.adminResetPassword(id, body.newPassword);
  }
}
