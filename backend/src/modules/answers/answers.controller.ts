import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Answers')
@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @ApiOperation({ 
    summary: 'Tạo đáp án mới',
    description: 'Tạo đáp án đúng cho một content. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateAnswerDto })
  @ApiResponse({ status: 201, description: 'Tạo đáp án thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createAnswerDto: CreateAnswerDto) {
    return this.answersService.create(createAnswerDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả đáp án',
    description: 'Lấy danh sách tất cả các đáp án. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lấy danh sách đáp án thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get()
  findAll() {
    return this.answersService.findAll();
  }

  @ApiOperation({ 
    summary: 'Lấy đáp án theo testId và sectionId',
    description: 'Lấy đáp án (transcript, answer keys) của một section cụ thể trong test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'testId', description: 'ID của test', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sectionId', description: 'ID của test section', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Lấy đáp án theo testId và sectionId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đáp án' })
  @Get('test/:testId/section/:sectionId')
  findByTestIdAndSectionId(
    @Param('testId') testId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.answersService.findByTestIdAndSectionId(testId, sectionId);
  }

  @ApiOperation({ 
    summary: 'Lấy tất cả đáp án theo testId',
    description: 'Lấy tất cả đáp án của một test. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'testId', description: 'ID của test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy đáp án theo testId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('test/:testId')
  findByTestId(@Param('testId') testId: string) {
    return this.answersService.findByTestId(testId);
  }

  @ApiOperation({ 
    summary: 'Lấy đáp án theo sectionId',
    description: 'Lấy đáp án của một section cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'sectionId', description: 'ID của test section', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Lấy đáp án theo sectionId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đáp án' })
  @Get('section/:sectionId')
  findBySectionId(@Param('sectionId') sectionId: string) {
    return this.answersService.findBySectionId(sectionId);
  }

  // DEPRECATED: Keep for backward compatibility
  @ApiOperation({ 
    summary: '[DEPRECATED] Lấy đáp án theo contentId',
    description: 'DEPRECATED: Sử dụng endpoint mới /test/:testId/section/:sectionId thay thế.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'contentId', description: 'ID của content', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy đáp án theo contentId thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get('content/:contentId')
  findByContentId(@Param('contentId') contentId: string) {
    return this.answersService.findByContentId(contentId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết đáp án theo ID',
    description: 'Lấy thông tin chi tiết của một đáp án cụ thể. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của đáp án', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết đáp án thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đáp án' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.answersService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật đáp án',
    description: 'Cập nhật đáp án đúng. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của đáp án cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateAnswerDto })
  @ApiResponse({ status: 200, description: 'Cập nhật đáp án thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đáp án' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnswerDto: UpdateAnswerDto) {
    return this.answersService.update(id, updateAnswerDto);
  }

  @ApiOperation({ 
    summary: 'Xóa đáp án',
    description: 'Xóa một đáp án (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của đáp án cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa đáp án thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đáp án' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.answersService.remove(id);
  }
}
