import { Controller, Get, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { UserStatisticsDto, TestStatsDto, CourseStatsDto, FlashcardStatsDto } from './dto/user-statistics.dto';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({
    summary: 'Lấy tổng hợp thống kê của user',
    description: 'Lấy tất cả thống kê về bài test, khóa học và flashcard của user. Yêu cầu authentication.',
  })
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công', type: UserStatisticsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId')
  async getUserStatistics(
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<UserStatisticsDto> {
    // Verify user can only access their own statistics
    const requestUserId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (requestUserId !== userId) {
      throw new UnauthorizedException('You can only access your own statistics');
    }
    return await this.statisticsService.getUserStatistics(userId);
  }

  @ApiOperation({
    summary: 'Lấy thống kê chi tiết về bài test',
    description: 'Lấy thống kê chi tiết về các bài test đã làm. Yêu cầu authentication.',
  })
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê bài test thành công', type: TestStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId/tests')
  async getTestStatistics(
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<TestStatsDto> {
    const requestUserId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (requestUserId !== userId) {
      throw new UnauthorizedException('You can only access your own statistics');
    }
    return await this.statisticsService.getTestStatistics(userId);
  }

  @ApiOperation({
    summary: 'Lấy thống kê chi tiết về khóa học',
    description: 'Lấy thống kê chi tiết về các khóa học đã đăng ký. Yêu cầu authentication.',
  })
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê khóa học thành công', type: CourseStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId/courses')
  async getCourseStatistics(
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<CourseStatsDto> {
    const requestUserId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (requestUserId !== userId) {
      throw new UnauthorizedException('You can only access your own statistics');
    }
    return await this.statisticsService.getCourseStatistics(userId);
  }

  @ApiOperation({
    summary: 'Lấy thống kê chi tiết về flashcard',
    description: 'Lấy thống kê chi tiết về các flashcard deck đang học. Yêu cầu authentication.',
  })
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê flashcard thành công', type: FlashcardStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId/flashcards')
  async getFlashcardStatistics(
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<FlashcardStatsDto> {
    const requestUserId = req.user?._id?.toString() || req.user?.userId?.toString();
    if (requestUserId !== userId) {
      throw new UnauthorizedException('You can only access your own statistics');
    }
    return await this.statisticsService.getFlashcardStatistics(userId);
  }
}

