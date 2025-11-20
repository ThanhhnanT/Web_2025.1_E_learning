import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Flashcards')
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @ApiOperation({ 
    summary: 'Tạo flashcard mới',
    description: 'Tạo một flashcard mới. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateFlashcardDto })
  @ApiResponse({ status: 201, description: 'Tạo flashcard thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createFlashcardDto: CreateFlashcardDto) {
    return this.flashcardsService.create(createFlashcardDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách flashcards',
    description: 'Lấy danh sách flashcards với các bộ lọc tùy chọn. API này là public.'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Lọc theo ID người dùng' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Lọc theo ID khóa học' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'Lọc theo ID lesson' })
  @ApiQuery({ name: 'deckName', required: false, description: 'Lọc theo tên bộ thẻ' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách flashcards thành công' })
  @Public()
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('deckName') deckName?: string,
  ) {
    return this.flashcardsService.findAll(userId, courseId, lessonId, deckName);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết flashcard theo ID',
    description: 'Lấy thông tin chi tiết của một flashcard cụ thể. API này là public.'
  })
  @ApiParam({ name: 'id', description: 'ID của flashcard', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết flashcard thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy flashcard' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcardsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật flashcard',
    description: 'Cập nhật thông tin của một flashcard. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của flashcard cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateFlashcardDto })
  @ApiResponse({ status: 200, description: 'Cập nhật flashcard thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy flashcard' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlashcardDto: UpdateFlashcardDto) {
    return this.flashcardsService.update(id, updateFlashcardDto);
  }

  @ApiOperation({ 
    summary: 'Xóa flashcard',
    description: 'Xóa một flashcard (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của flashcard cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa flashcard thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy flashcard' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashcardsService.remove(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật review cho flashcard',
    description: 'Cập nhật số lần review và thời gian review cuối cùng. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của flashcard cần cập nhật review', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật review thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy flashcard' })
  @Patch(':id/review')
  updateReview(@Param('id') id: string) {
    return this.flashcardsService.updateReview(id);
  }
}

