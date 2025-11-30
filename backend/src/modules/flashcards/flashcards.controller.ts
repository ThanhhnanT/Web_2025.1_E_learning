import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { CreateCardDto } from './dto/create-card.dto';
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
  @ApiQuery({ name: 'deckId', required: false, description: 'Lọc theo ID bộ thẻ' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách flashcards thành công' })
  @Public()
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('deckId') deckId?: string,
  ) {
    return this.flashcardsService.findAll(userId, courseId, lessonId, deckId);
  }

  // Sample data endpoints - MUST be before @Get(':id') to avoid route conflict
  @ApiOperation({ 
    summary: 'Lấy danh sách sample decks',
    description: 'Lấy danh sách các sample decks có sẵn trong hệ thống. API này là public.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sample decks thành công' })
  @Public()
  @Get('samples')
  getSamples() {
    return this.flashcardsService.getSampleDecks();
  }

  @ApiOperation({ 
    summary: 'Import sample data',
    description: 'Import sample data từ JSON files vào database. Yêu cầu authentication và quyền admin.'
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Import sample data thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('samples/import')
  importSamples() {
    return this.flashcardsService.importSampleData();
  }

  // Cards endpoints - MUST be before @Get(':id') to avoid route conflict
  @ApiOperation({ 
    summary: 'Lấy tất cả cards trong deck',
    description: 'Lấy danh sách tất cả cards trong một deck cụ thể.'
  })
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cards thành công' })
  @Public()
  @Get('decks/:deckId/cards')
  findCardsByDeck(@Param('deckId') deckId: string) {
    return this.flashcardsService.findCardsByDeck(deckId);
  }

  @ApiOperation({ 
    summary: 'Thêm card vào deck',
    description: 'Thêm một card mới vào deck. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: CreateCardDto })
  @ApiResponse({ status: 201, description: 'Thêm card thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('decks/:deckId/cards')
  createCard(@Param('deckId') deckId: string, @Body() createCardDto: CreateCardDto) {
    return this.flashcardsService.createCard(deckId, createCardDto);
  }

  @ApiOperation({ 
    summary: 'Thêm nhiều cards cùng lúc',
    description: 'Thêm nhiều cards vào deck trong một lần. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: [CreateCardDto] })
  @ApiResponse({ status: 201, description: 'Thêm cards thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post('decks/:deckId/cards/batch')
  createCardsBatch(@Param('deckId') deckId: string, @Body() createCardDtos: CreateCardDto[]) {
    return this.flashcardsService.createCardsBatch(deckId, createCardDtos);
  }

  @ApiOperation({ 
    summary: 'Cập nhật card',
    description: 'Cập nhật thông tin của một card. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cardId', description: 'ID của card', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateFlashcardDto })
  @ApiResponse({ status: 200, description: 'Cập nhật card thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy card' })
  @Patch('decks/:deckId/cards/:cardId')
  updateCard(@Param('deckId') deckId: string, @Param('cardId') cardId: string, @Body() updateFlashcardDto: UpdateFlashcardDto) {
    return this.flashcardsService.updateCard(deckId, cardId, updateFlashcardDto);
  }

  @ApiOperation({ 
    summary: 'Xóa card',
    description: 'Xóa một card khỏi deck (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cardId', description: 'ID của card', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa card thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy card' })
  @Delete('decks/:deckId/cards/:cardId')
  removeCard(@Param('deckId') deckId: string, @Param('cardId') cardId: string) {
    return this.flashcardsService.removeCard(deckId, cardId);
  }

  // This route must come AFTER all specific routes to avoid conflicts
  // Routes like /flashcards/progress, /flashcards/decks, /flashcards/samples are handled by other controllers
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
    // Reject common route names that might conflict with other controllers
    if (id === 'decks' || id === 'progress' || id === 'samples') {
      return null;
    }
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

