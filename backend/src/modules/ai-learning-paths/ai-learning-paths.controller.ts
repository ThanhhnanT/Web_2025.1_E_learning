import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AiLearningPathsService } from './ai-learning-paths.service';
import { CreateAiLearningPathDto } from './dto/create-ai-learning-path.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@ApiTags('AI Learning Paths')
@Controller('ai-learning-paths')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiLearningPathsController {
  constructor(private readonly aiLearningPathsService: AiLearningPathsService) {}

  @ApiOperation({ 
    summary: 'Tạo lộ trình học tập mới bằng AI',
    description: 'Tạo một lộ trình học tập được cá nhân hóa bằng AI dựa trên mục tiêu và trình độ của người dùng'
  })
  @ApiResponse({ status: 201, description: 'Tạo lộ trình thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc AI service lỗi' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateLearningPath(
    @Body() createDto: CreateAiLearningPathDto,
    @Request() req: any
  ) {
    const userId = req.user._id.toString();
    return this.aiLearningPathsService.generateLearningPath(createDto, userId);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách lộ trình học tập của user',
    description: 'Lấy tất cả các lộ trình học tập đã tạo của user hiện tại'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get()
  async getUserLearningPaths(@Request() req: any) {
    const userId = req.user._id.toString();
    return this.aiLearningPathsService.getUserLearningPaths(userId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết lộ trình học tập',
    description: 'Lấy thông tin chi tiết của một lộ trình học tập cụ thể'
  })
  @ApiParam({ name: 'id', description: 'ID của lộ trình học tập' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lộ trình' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get(':id')
  async getLearningPath(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user._id.toString();
    return this.aiLearningPathsService.getLearningPath(id, userId);
  }

  @ApiOperation({ 
    summary: 'Cập nhật tiến độ học tập',
    description: 'Cập nhật tiến độ học tập của một lộ trình (ngày đã hoàn thành, phần trăm hoàn thành, etc.)'
  })
  @ApiParam({ name: 'id', description: 'ID của lộ trình học tập' })
  @ApiResponse({ status: 200, description: 'Cập nhật tiến độ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lộ trình' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Patch(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() updateDto: UpdateProgressDto,
    @Request() req: any
  ) {
    const userId = req.user._id.toString();
    return this.aiLearningPathsService.updateProgress(id, updateDto, userId);
  }

  @ApiOperation({ 
    summary: 'Lấy tiến độ học tập',
    description: 'Lấy thông tin tiến độ học tập của một lộ trình'
  })
  @ApiParam({ name: 'id', description: 'ID của lộ trình học tập' })
  @ApiResponse({ status: 200, description: 'Lấy tiến độ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lộ trình' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get(':id/progress')
  async getProgress(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user._id.toString();
    return this.aiLearningPathsService.getProgress(id, userId);
  }
}

