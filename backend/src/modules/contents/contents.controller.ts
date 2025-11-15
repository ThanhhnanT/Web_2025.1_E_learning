import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Contents')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @ApiOperation({ 
    summary: 'Tạo content mới',
    description: 'Tạo nội dung câu hỏi cho bài test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 201, description: 'Tạo content thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentsService.create(createContentDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả contents',
    description: 'Lấy danh sách tất cả các contents. API này là public, không cần authentication.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách contents thành công' })
  @Public()
  @Get()
  findAll() {
    return this.contentsService.findAll();
  }

  @ApiOperation({ 
    summary: 'Lấy contents theo testId',
    description: 'Lấy tất cả contents của một bài test cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'testId', description: 'ID của bài test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy contents theo testId thành công' })
  @Public()
  @Get('test/:testId')
  findByTestId(@Param('testId') testId: string) {
    return this.contentsService.findByTestId(testId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết content theo ID',
    description: 'Lấy thông tin chi tiết của một content cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của content', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết content thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy content' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật content',
    description: 'Cập nhật nội dung của một content. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của content cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateContentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật content thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy content' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentsService.update(id, updateContentDto);
  }

  @ApiOperation({ 
    summary: 'Xóa content',
    description: 'Xóa một content (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của content cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa content thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy content' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentsService.remove(id);
  }
}
