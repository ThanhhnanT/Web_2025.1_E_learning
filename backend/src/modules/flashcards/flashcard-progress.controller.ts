import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@ApiTags('Flashcard Progress')
// Use a different path to avoid conflict with /flashcards/:id route
@Controller('flashcard-progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FlashcardProgressController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @ApiOperation({ 
    summary: 'Lấy progress của user với deck',
    description: 'Lấy thông tin progress của user với một deck cụ thể. Yêu cầu authentication.'
  })
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID người dùng (mặc định lấy từ token)' })
  @ApiResponse({ status: 200, description: 'Lấy progress thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get(':deckId')
  findOne(@Request() req: any, @Param('deckId') deckId: string, @Query('userId') userId?: string) {
    // Extract userId from JWT token if not provided in query
    const finalUserId = userId || req.user?._id?.toString();
    return this.flashcardsService.findProgress(deckId, finalUserId);
  }

  @ApiOperation({ 
    summary: 'Cập nhật progress',
    description: 'Cập nhật progress của user với deck (learned, remembered, review). Yêu cầu authentication.'
  })
  @ApiParam({ name: 'deckId', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID người dùng (mặc định lấy từ token)' })
  @ApiBody({ type: UpdateProgressDto })
  @ApiResponse({ status: 200, description: 'Cập nhật progress thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Patch(':deckId')
  update(@Request() req: any, @Param('deckId') deckId: string, @Body() updateProgressDto: UpdateProgressDto, @Query('userId') userId?: string) {
    // Extract userId from JWT token if not provided in query
    const finalUserId = userId || req.user?._id?.toString();
    return this.flashcardsService.updateProgress(deckId, updateProgressDto, finalUserId);
  }

  @ApiOperation({ 
    summary: 'Lấy tất cả progress của user',
    description: 'Lấy tất cả progress của user với tất cả decks. Yêu cầu authentication.'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'ID người dùng (mặc định lấy từ token)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách progress thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get()
  async findAll(@Request() req: any, @Query('userId') userId?: string) {
    // Extract userId from JWT token if not provided in query
    const finalUserId = userId || req.user?._id?.toString();
    return await this.flashcardsService.findAllProgress(finalUserId);
  }
}

