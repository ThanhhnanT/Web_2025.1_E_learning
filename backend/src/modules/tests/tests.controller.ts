import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

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
    summary: 'Lấy danh sách tất cả bài test',
    description: 'Lấy danh sách tất cả các bài test. API này là public, không cần authentication.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bài test thành công' })
  @Public()
  @Get()
  findAll() {
    return this.testsService.findAll();
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
