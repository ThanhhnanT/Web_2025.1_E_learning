import { Controller, Get, Post, Body, Patch, Param, Query, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ 
    summary: 'Lấy danh sách enrollments của user',
    description: 'Lấy tất cả enrollments của user đang đăng nhập. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái (active, completed, suspended)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách enrollments thành công' })
  @Get()
  async getMyEnrollments(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user?.sub || req.user?.id;
    return this.enrollmentsService.getEnrollments(userId, status);
  }

  @ApiOperation({ 
    summary: 'Lấy thống kê enrollments của user',
    description: 'Lấy các thống kê về enrollments của user. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  @Get('stats/me')
  async getMyStats(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.enrollmentsService.getEnrollmentStats(userId);
  }

  @ApiOperation({ 
    summary: 'Kiểm tra enrollment cho một khóa học',
    description: 'Kiểm tra xem user đã enroll vào khóa học chưa. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', description: 'ID của khóa học' })
  @ApiResponse({ status: 200, description: 'Kiểm tra thành công' })
  @Get('check/:courseId')
  async checkEnrollment(@Param('courseId') courseId: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.enrollmentsService.checkEnrollment(userId, courseId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết một enrollment',
    description: 'Lấy thông tin chi tiết của một enrollment. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy enrollment thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy enrollment' })
  @Get(':id')
  async getEnrollmentById(@Param('id') id: string) {
    return this.enrollmentsService.getEnrollmentById(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật progress của enrollment',
    description: 'Cập nhật tiến độ học tập của enrollment. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment' })
  @ApiResponse({ status: 200, description: 'Cập nhật progress thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy enrollment' })
  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    return this.enrollmentsService.updateProgress(id, body.progress);
  }

  @ApiOperation({ 
    summary: 'Đánh dấu lesson đã hoàn thành',
    description: 'Đánh dấu một lesson là đã hoàn thành trong enrollment. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment' })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({ status: 200, description: 'Đánh dấu lesson thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy enrollment' })
  @Patch(':id/lessons/:lessonId/complete')
  async markLessonComplete(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.enrollmentsService.markLessonComplete(id, lessonId);
  }

  @ApiOperation({ 
    summary: 'Lấy thông tin progress của enrollment',
    description: 'Lấy chi tiết tiến độ học tập (số lesson đã hoàn thành, tổng số lesson, phần trăm). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment' })
  @ApiResponse({ status: 200, description: 'Lấy progress thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy enrollment' })
  @Get(':id/progress')
  async getEnrollmentProgress(@Param('id') id: string) {
    return this.enrollmentsService.getEnrollmentProgress(id);
  }

  @ApiOperation({ 
    summary: 'Suspend một enrollment',
    description: 'Tạm dừng một enrollment. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment' })
  @ApiResponse({ status: 200, description: 'Suspend thành công' })
  @Patch(':id/suspend')
  async suspendEnrollment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.enrollmentsService.suspendEnrollment(id, body.reason);
  }

  @ApiOperation({ 
    summary: 'Reactivate một enrollment',
    description: 'Kích hoạt lại một enrollment đã bị suspend. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của enrollment' })
  @ApiResponse({ status: 200, description: 'Reactivate thành công' })
  @Patch(':id/reactivate')
  async reactivateEnrollment(@Param('id') id: string) {
    return this.enrollmentsService.reactivateEnrollment(id);
  }
}

