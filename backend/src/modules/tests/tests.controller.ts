import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @ApiOperation({ 
    summary: 'Tạo bài test mới',
    description: 'Tạo một bài test mới. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateTestDto })
  @ApiResponse({ status: 201, description: 'Tạo bài test thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách bài test với phân trang',
    description: 'Lấy danh sách các bài test với phân trang. API này là public, không cần authentication. Hỗ trợ query parameters: page (mặc định 1), pageSize (mặc định 12), skill, testType, series, level, language.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Số lượng items mỗi trang (mặc định: 12)', example: 12 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm theo tiêu đề/series/slug', example: 'Cambridge' })
  @ApiQuery({ name: 'skill', required: false, type: String, description: 'Lọc theo kỹ năng (reading, listening, speaking, writing)', example: 'reading' })
  @ApiQuery({ name: 'testType', required: false, type: String, description: 'Lọc theo loại bài test (IELTS, HSK, TOEFL, TOEIC, OTHER)', example: 'IELTS' })
  @ApiQuery({ name: 'series', required: false, type: String, description: 'Lọc theo bộ đề (ví dụ: Cambridge IELTS 20)', example: 'Cambridge IELTS 20' })
  @ApiQuery({ name: 'level', required: false, type: String, description: 'Lọc theo level', example: 'Intermediate' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Lọc theo ngôn ngữ đề thi', example: 'English' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Lọc theo trạng thái bài test', example: 'active' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách bài test thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' }
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number', example: 2 },
            pageSize: { type: 'number', example: 10 },
            totalItems: { type: 'number', example: 53 },
            totalPages: { type: 'number', example: 6 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @Public()
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('skill') skill?: string,
    @Query('testType') testType?: string,
    @Query('series') series?: string,
    @Query('level') level?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 12;
    return this.testsService.findAllPaginated(pageNum, pageSizeNum, {
      skill,
      testType,
      series,
      level,
      language,
      status,
      search,
    });
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết bài test theo ID',
    description: 'Lấy thông tin chi tiết của một bài test cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của bài test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết bài test thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài test' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật bài test',
    description: 'Cập nhật thông tin của một bài test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của bài test cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateTestDto })
  @ApiResponse({ status: 200, description: 'Cập nhật bài test thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài test' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testsService.update(id, updateTestDto);
  }

  @ApiOperation({ 
    summary: 'Xóa bài test',
    description: 'Xóa một bài test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của bài test cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa bài test thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài test' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }
}
