import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Results')
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

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
