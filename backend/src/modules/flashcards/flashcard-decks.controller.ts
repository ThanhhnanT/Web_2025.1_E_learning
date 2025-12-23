import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@ApiTags('Flashcard Decks')
@Controller('flashcards/decks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FlashcardDecksController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @ApiOperation({ 
    summary: 'Admin - Lấy danh sách decks với phân trang',
    description: 'Danh sách deck có phân trang, search, sort. Yêu cầu authentication.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Trang hiện tại', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số bản ghi mỗi trang', example: 12 })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo tên/mô tả' })
  @ApiQuery({ name: 'sortField', required: false, description: 'Trường sắp xếp', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Thứ tự sắp xếp', example: 'desc' })
  @Get('admin')
  findAllPaged(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('userId') userId?: string,
  ) {
    return this.flashcardsService.findDecksAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      sortField,
      sortOrder,
      userId, // optional filter; if omitted, return all
    });
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách decks',
    description: 'Lấy danh sách decks của user. Yêu cầu authentication.'
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Lọc theo ID người dùng' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách decks thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Get()
  findAll(@Request() req: any, @Query('userId') userId?: string) {
    // Extract userId from JWT token if not provided in query
    const finalUserId = userId || req.user?._id?.toString();
    return this.flashcardsService.findAllDecks(finalUserId);
  }

  @ApiOperation({ 
    summary: 'Tạo deck mới',
    description: 'Tạo một deck mới. Yêu cầu authentication.'
  })
  @ApiBody({ type: CreateDeckDto })
  @ApiResponse({ status: 201, description: 'Tạo deck thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createDeckDto: CreateDeckDto) {
    return this.flashcardsService.createDeck(createDeckDto);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết deck theo ID',
    description: 'Lấy thông tin chi tiết của một deck cụ thể.'
  })
  @ApiParam({ name: 'id', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết deck thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deck' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcardsService.findOneDeck(id);
  }

  @ApiOperation({ 
    summary: 'Lấy summary deck',
    description: 'Trả về deck, stats, cards, progress cho user. Yêu cầu authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của deck', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID người dùng (mặc định lấy từ token)' })
  @Get(':id/summary')
  findSummary(@Request() req: any, @Param('id') id: string, @Query('userId') userId?: string) {
    const finalUserId = userId || req.user?._id?.toString();
    return this.flashcardsService.getDeckSummary(id, finalUserId);
  }

  @ApiOperation({ 
    summary: 'Cập nhật deck',
    description: 'Cập nhật thông tin của một deck. Yêu cầu authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của deck cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateDeckDto })
  @ApiResponse({ status: 200, description: 'Cập nhật deck thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deck' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeckDto: UpdateDeckDto) {
    return this.flashcardsService.updateDeck(id, updateDeckDto);
  }

  @ApiOperation({ 
    summary: 'Xóa deck',
    description: 'Xóa một deck (soft delete). Yêu cầu authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của deck cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa deck thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deck' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashcardsService.removeDeck(id);
  }
}

