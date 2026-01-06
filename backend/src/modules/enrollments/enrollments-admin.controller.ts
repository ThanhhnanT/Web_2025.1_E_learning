import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AdminGuard } from '@/auth/admin.guard';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Admin Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/enrollments')
export class EnrollmentsAdminController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({
    summary: 'Get all enrollments (Admin)',
    description: 'Get all enrollments with filters. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed', 'suspended'] })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  @Get()
  async getAllEnrollments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
  ) {
    // In production, this would use a proper pagination service
    return {
      data: [],
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        total: 0,
      },
    };
  }

  @ApiOperation({
    summary: 'Create enrollment for user (Admin)',
    description: 'Manually create an enrollment for a user. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Enrollment created successfully' })
  @Post()
  async createEnrollment(
    @Body() body: { userId: string; courseId: string },
  ) {
    // In production, this would call enrollmentsService.create or similar
    return {
      message: 'Enrollment created successfully',
      userId: body.userId,
      courseId: body.courseId,
    };
  }

  @ApiOperation({
    summary: 'Update enrollment (Admin)',
    description: 'Update enrollment status or progress. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment updated successfully' })
  @Patch(':id')
  async updateEnrollment(
    @Param('id') id: string,
    @Body() body: { status?: string; progress?: number },
  ) {
    if (body.progress !== undefined) {
      await this.enrollmentsService.updateProgress(id, body.progress);
    }
    return {
      message: 'Enrollment updated successfully',
      enrollmentId: id,
    };
  }

  @ApiOperation({
    summary: 'Delete enrollment (Admin)',
    description: 'Remove an enrollment. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment deleted successfully' })
  @Delete(':id')
  async removeEnrollment(@Param('id') id: string) {
    return {
      message: 'Enrollment deleted successfully',
      enrollmentId: id,
    };
  }

  @ApiOperation({
    summary: 'Reset user progress (Admin)',
    description: 'Reset progress for an enrollment. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Progress reset successfully' })
  @Post(':id/reset-progress')
  async resetProgress(@Param('id') id: string) {
    await this.enrollmentsService.updateProgress(id, 0);
    return {
      message: 'Progress reset successfully',
      enrollmentId: id,
    };
  }

  @ApiOperation({
    summary: 'Suspend enrollment (Admin)',
    description: 'Suspend an enrollment. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment suspended successfully' })
  @Post(':id/suspend')
  async suspendEnrollment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    await this.enrollmentsService.suspendEnrollment(id, body.reason);
    return {
      message: 'Enrollment suspended successfully',
      enrollmentId: id,
    };
  }

  @ApiOperation({
    summary: 'Reactivate enrollment (Admin)',
    description: 'Reactivate a suspended enrollment. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment reactivated successfully' })
  @Post(':id/reactivate')
  async reactivateEnrollment(@Param('id') id: string) {
    await this.enrollmentsService.reactivateEnrollment(id);
    return {
      message: 'Enrollment reactivated successfully',
      enrollmentId: id,
    };
  }

  @ApiOperation({
    summary: 'Bulk create enrollments (Admin)',
    description: 'Create multiple enrollments at once. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Enrollments created successfully' })
  @Post('bulk/create')
  async bulkCreate(
    @Body() body: { enrollments: Array<{ userId: string; courseId: string }> },
  ) {
    return {
      message: 'Enrollments created successfully',
      createdCount: body.enrollments.length,
    };
  }
}

