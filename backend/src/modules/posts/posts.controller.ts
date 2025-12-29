import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Public } from '@/auth/decorate/customize';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: 'Tạo post mới',
    description: 'Tạo một post mới. Yêu cầu authentication. Có thể upload ảnh.',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Tạo post thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() req: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, GIF, WEBP)');
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('Kích thước file không được vượt quá 5MB');
      }
    }

    const userId = req.user._id || req.user.id;
    return this.postsService.create(createPostDto, userId.toString(), file);
  }

  @ApiOperation({
    summary: 'Lấy danh sách posts',
    description: 'Lấy danh sách posts với pagination và sorting. Public endpoint.',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách posts thành công' })
  @Public()
  @Get()
  async findAll(@Query() queryDto: QueryPostsDto, @Request() req?: any) {
    const userId = req?.user?._id?.toString() || req?.user?.id;
    return this.postsService.findAll(queryDto, userId);
  }

  @ApiOperation({
    summary: 'Lấy chi tiết post',
    description: 'Lấy thông tin chi tiết của một post. Public endpoint.',
  })
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết post thành công' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req?: any) {
    const userId = req?.user?._id?.toString() || req?.user?.id;
    return this.postsService.findOne(id, userId);
  }

  @ApiOperation({
    summary: 'Cập nhật post',
    description: 'Cập nhật post. Chỉ owner mới được cập nhật.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Cập nhật post thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, GIF, WEBP)');
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('Kích thước file không được vượt quá 5MB');
      }
    }

    const userId = req.user._id || req.user.id;
    return this.postsService.update(id, updatePostDto, userId.toString(), file);
  }

  @ApiOperation({
    summary: 'Cập nhật trạng thái post',
    description: 'Cập nhật trạng thái post. Chỉ admin hoặc editor mới được cập nhật.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiBody({ type: UpdatePostStatusDto })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not admin/editor' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateStatusDto: UpdatePostStatusDto,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.updateStatus(id, updateStatusDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Xóa post',
    description: 'Xóa post (soft delete). Chỉ owner mới được xóa.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Xóa post thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user._id || req.user.id;
    return this.postsService.remove(id, userId.toString());
  }

  @ApiOperation({
    summary: 'Like/Unlike post',
    description: 'Like hoặc unlike một post. Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Like/Unlike thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':id/like')
  async likePost(@Param('id') id: string, @Request() req: any) {
    const userId = req.user._id || req.user.id;
    return this.postsService.likePost(id, userId.toString());
  }

  @ApiOperation({
    summary: 'Lấy danh sách users đã like post',
    description: 'Lấy danh sách tất cả users đã like post này. Public endpoint.',
  })
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách likes thành công' })
  @Public()
  @Get(':id/likes')
  async getPostLikes(@Param('id') id: string) {
    return this.postsService.getPostLikes(id);
  }

  @ApiOperation({
    summary: 'React to post',
    description: 'Thêm hoặc xóa reaction trên post. Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiBody({ type: CreateReactionDto })
  @ApiResponse({ status: 200, description: 'React thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':id/reactions')
  async reactToPost(
    @Param('id') id: string,
    @Request() req: any,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.reactToPost(id, createReactionDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Lấy reactions của post',
    description: 'Lấy tất cả reactions của một post. Public endpoint.',
  })
  @ApiParam({ name: 'id', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Lấy reactions thành công' })
  @Public()
  @Get(':id/reactions')
  async getPostReactions(
    @Param('id') id: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?._id?.toString() || req?.user?.id;
    return this.postsService.getPostReactions(id, userId);
  }

  // Comments endpoints
  @ApiOperation({
    summary: 'Lấy comments của post',
    description: 'Lấy tất cả comments của một post (nested structure). Public endpoint.',
  })
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiResponse({ status: 200, description: 'Lấy comments thành công' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Public()
  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string, @Request() req?: any) {
    const userId = req?.user?._id?.toString() || req?.user?.id;
    return this.postsService.getComments(postId, userId);
  }

  @ApiOperation({
    summary: 'Thêm comment mới',
    description: 'Thêm comment mới vào post. Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Tạo comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':postId/comments')
  @UseInterceptors(FileInterceptor('image'))
  async createComment(
    @Param('postId') postId: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.postsService.createComment(postId, createCommentDto, userId.toString(), file);
  }

  @ApiOperation({
    summary: 'Reply comment',
    description: 'Reply một comment (tạo nested comment). Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiParam({ name: 'commentId', description: 'ID của comment cha' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Tạo reply thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post or comment not found' })
  @Post(':postId/comments/:commentId/replies')
  @UseInterceptors(FileInterceptor('image'))
  async replyComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.createComment(
      postId,
      { ...createCommentDto, parentId: commentId },
      userId.toString(),
      file,
    );
  }

  @ApiOperation({
    summary: 'Cập nhật comment',
    description: 'Cập nhật comment. Chỉ owner mới được cập nhật.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Patch(':postId/comments/:commentId')
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.updateComment(postId, commentId, updateCommentDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Xóa comment',
    description: 'Xóa comment (soft delete). Chỉ owner mới được xóa.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  @ApiResponse({ status: 200, description: 'Xóa comment thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete(':postId/comments/:commentId')
  async removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.removeComment(postId, commentId, userId.toString());
  }

  @ApiOperation({
    summary: 'React to comment',
    description: 'Thêm hoặc xóa reaction trên comment. Yêu cầu authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  @ApiBody({ type: CreateReactionDto })
  @ApiResponse({ status: 200, description: 'React thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Post(':postId/comments/:commentId/reactions')
  async reactToComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.reactToComment(postId, commentId, createReactionDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Lấy reactions của comment',
    description: 'Lấy tất cả reactions của một comment. Public endpoint.',
  })
  @ApiParam({ name: 'postId', description: 'ID của post' })
  @ApiParam({ name: 'commentId', description: 'ID của comment' })
  @ApiResponse({ status: 200, description: 'Lấy reactions thành công' })
  @Public()
  @Get(':postId/comments/:commentId/reactions')
  async getCommentReactions(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?._id?.toString() || req?.user?.id;
    return this.postsService.getCommentReactions(commentId, userId);
  }
}

