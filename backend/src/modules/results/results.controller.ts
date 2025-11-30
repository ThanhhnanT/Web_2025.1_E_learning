import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ScoringService, RawUserAnswer } from './scoring.service';

@ApiTags('Results')
@Controller('results')
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly scoringService: ScoringService,
  ) {}

  @ApiOperation({ 
    summary: 'Tạo kết quả bài test mới',
    description: 'Lưu kết quả bài test của user. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateResultDto })
  @ApiResponse({ status: 201, description: 'Tạo kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createResultDto: CreateResultDto) {
    return this.resultsService.create(createResultDto);
  }

  @ApiOperation({
    summary: 'Tự động chấm điểm và lưu kết quả bài test',
    description:
      'Nhận câu trả lời của user cho một bài test, tự động chấm điểm (IELTS Listening/Reading) và lưu vào collection results. Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'testId',
    description: 'ID của bài test',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description:
      'Danh sách câu trả lời của user cho bài test. Mỗi phần tử gồm questionNumber, userAnswer (mảng string) và timeSpent (tùy chọn, giây).',
    schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionNumber: { type: 'number' },
              userAnswer: {
                type: 'array',
                items: { type: 'string' },
              },
              timeSpent: {
                type: 'number',
                description: 'Thời gian làm câu hỏi (giây)',
              },
            },
            required: ['questionNumber', 'userAnswer'],
          },
        },
        timeSpent: {
          type: 'number',
          description: 'Tổng thời gian làm bài (phút)',
        },
        completedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['answers'],
    },
  })
  @ApiResponse({ status: 201, description: 'Chấm điểm và tạo kết quả thành công' })
  @Post('auto-score/:testId')
  async autoScoreTest(
    @Param('testId') testId: string,
    @Body()
    payload: {
      answers: RawUserAnswer[];
      timeSpent?: number;
      completedAt?: Date;
      selectedSectionIds?: string[];
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const scoring = await this.scoringService.scoreTest({
      userId,
      testId,
      answers: payload.answers || [],
      timeSpent: payload.timeSpent,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
      selectedSectionIds: payload.selectedSectionIds,
    });

    const created = await this.resultsService.create(
      scoring.resultData as unknown as CreateResultDto,
    );

    return created;
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả kết quả',
    description: 'Lấy danh sách tất cả các kết quả bài test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lấy danh sách kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get()
  findAll() {
    return this.resultsService.findAll();
  }

  @ApiOperation({ 
    summary: 'Lấy kết quả theo userId',
    description: 'Lấy tất cả kết quả bài test của một user cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy kết quả theo userId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.resultsService.findByUserId(userId);
  }

  @ApiOperation({ 
    summary: 'Lấy kết quả theo testId',
    description: 'Lấy tất cả kết quả của một bài test cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'testId', description: 'ID của bài test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy kết quả theo testId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('test/:testId')
  findByTestId(@Param('testId') testId: string) {
    return this.resultsService.findByTestId(testId);
  }

  @ApiOperation({ 
    summary: 'Lấy kết quả theo userId và testId',
    description: 'Lấy kết quả của một user cho một bài test cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'testId', description: 'ID của bài test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('user/:userId/test/:testId')
  findByUserAndTest(
    @Param('userId') userId: string,
    @Param('testId') testId: string,
  ) {
    return this.resultsService.findByUserAndTest(userId, testId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết kết quả theo ID',
    description: 'Lấy thông tin chi tiết của một kết quả cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của kết quả', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resultsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Lấy chi tiết kết quả kèm cấu trúc test đầy đủ (cho màn review)',
    description:
      'Trả về kết quả làm bài cùng với cấu trúc bài test (sections, question groups, questions) để hiển thị màn hình review chi tiết.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'ID của kết quả',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết kết quả + cấu trúc test thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  @Get(':id/detail')
  async findDetail(@Param('id') id: string) {
    // Dùng ResultsService để lấy kết quả
    const result = await this.resultsService.findOne(id);
    if (!result) {
      return null;
    }

    // Tạm thời trả về chỉ result; phần test cấu trúc đầy đủ sẽ được lấy
    // từ endpoint /tests/:testId/full ở TestsFullController phía frontend.
    // Nếu muốn gộp luôn ở backend, có thể inject TestsService và các service liên quan.

    return {
      result,
    };
  }

  @ApiOperation({ 
    summary: 'Cập nhật kết quả',
    description: 'Cập nhật thông tin của một kết quả. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của kết quả cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateResultDto })
  @ApiResponse({ status: 200, description: 'Cập nhật kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResultDto: UpdateResultDto) {
    return this.resultsService.update(id, updateResultDto);
  }

  @ApiOperation({ 
    summary: 'Xóa kết quả',
    description: 'Xóa một kết quả (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của kết quả cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa kết quả thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resultsService.remove(id);
  }
}
