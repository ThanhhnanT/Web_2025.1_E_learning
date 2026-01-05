import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ 
    summary: 'Tạo comment/review mới',
    description: 'Tạo một comment mới cho bài test hoặc review cho khóa học. Yêu cầu authentication. Nếu là review cho course, cần có rating (1-5).'
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Tạo comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả comments',
    description: 'Lấy danh sách tất cả các comments. API này là public, không cần authentication.'
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách comments thành công' })
  @Public()
  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  @ApiOperation({ 
    summary: 'Lấy comments theo testId',
    description: 'Lấy tất cả comments của một bài test cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'testId', description: 'ID của bài test', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy comments theo testId thành công' })
  @Public()
  @Get('test/:testId')
  findByTestId(@Param('testId') testId: string) {
    return this.commentsService.findByTestId(testId);
  }

  @ApiOperation({ 
    summary: 'Lấy comments theo userId',
    description: 'Lấy tất cả comments của một user cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'userId', description: 'ID của user', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy comments theo userId thành công' })
  @Public()
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.commentsService.findByUserId(userId);
  }

  @ApiOperation({ 
    summary: 'Lấy reviews/comments theo courseId',
    description: 'Lấy tất cả reviews/comments của một khóa học cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'courseId', description: 'ID của khóa học', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy reviews theo courseId thành công' })
  @Public()
  @Get('course/:courseId')
  findByCourseId(@Param('courseId') courseId: string) {
    return this.commentsService.findByCourseId(courseId);
  }

  @ApiOperation({ 
    summary: 'Lấy đánh giá trung bình và số lượng reviews của khóa học',
    description: 'Lấy điểm đánh giá trung bình và tổng số reviews của một khóa học. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'courseId', description: 'ID của khóa học', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy đánh giá trung bình thành công' })
  @Public()
  @Get('course/:courseId/rating')
  getCourseRating(@Param('courseId') courseId: string) {
    return this.commentsService.getCourseAverageRating(courseId);
  }

  @ApiOperation({ 
    summary: 'Lấy chi tiết comment theo ID',
    description: 'Lấy thông tin chi tiết của một comment cụ thể. API này là public, không cần authentication.'
  })
  @ApiParam({ name: 'id', description: 'ID của comment', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết comment thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy comment' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Cập nhật comment',
    description: 'Cập nhật nội dung của một comment. Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của comment cần cập nhật', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy comment' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @ApiOperation({ 
    summary: 'Xóa comment',
    description: 'Xóa một comment (soft delete). Yêu cầu authentication.'
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của comment cần xóa', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy comment' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
