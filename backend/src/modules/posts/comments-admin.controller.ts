import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AdminGuard } from '@/auth/admin.guard';
import { PostsService } from './posts.service';
import { UpdatePostCommentDto } from './dto/update-comment.dto';

@ApiTags('Admin Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/comments')
export class CommentsAdminController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: 'Get all comments (Admin)',
    description: 'Get all comments with filters including deleted comments. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'postId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @Get()
  async getAllComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('postId') postId?: string,
    @Query('userId') userId?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    
    // Include deleted comments if requested
    if (includeDeleted !== 'true') {
      filter.deletedAt = null;
    }

    if (postId) {
      filter.postId = postId;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Search in content
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const [comments, total] = await Promise.all([
      this.postsService['commentModel']
        .find(filter)
        .populate('userId', 'name email avatar_url')
        .populate('postId', 'content userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      this.postsService['commentModel'].countDocuments(filter),
    ]);

    return {
      data: comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @ApiOperation({
    summary: 'Get reported comments (Admin)',
    description: 'Get all comments that have been reported. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Reported comments retrieved successfully' })
  @Get('reported')
  async getReportedComments() {
    // For now, just get recent comments - in production you'd have a reported flag
    const comments = await this.postsService['commentModel']
      .find({ deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .populate('postId', 'content')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return {
      data: comments,
      count: comments.length,
    };
  }

  @ApiOperation({
    summary: 'Get comment statistics (Admin)',
    description: 'Get statistics about comments. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @Get('statistics')
  async getCommentStatistics() {
    const [total, active, deleted] = await Promise.all([
      this.postsService['commentModel'].countDocuments(),
      this.postsService['commentModel'].countDocuments({ deletedAt: null }),
      this.postsService['commentModel'].countDocuments({ deletedAt: { $ne: null } }),
    ]);

    return {
      total,
      active,
      deleted,
    };
  }

  @ApiOperation({
    summary: 'Get comment by ID (Admin)',
    description: 'Get detailed comment information. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Get(':id')
  async getCommentById(@Param('id') id: string) {
    const comment = await this.postsService['commentModel']
      .findById(id)
      .populate('userId', 'name email avatar_url')
      .populate('postId', 'content userId')
      .lean()
      .exec();

    if (!comment) {
      throw new Error('Comment not found');
    }

    return comment;
  }

  @ApiOperation({
    summary: 'Edit any comment (Admin)',
    description: 'Admin can edit any comment regardless of ownership.',
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Patch(':postId/comments/:commentId')
  async adminUpdateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdatePostCommentDto,
    @Request() req: any,
  ) {
    // Admin bypass - can edit any comment
    const userId = req.user._id || req.user.id;
    return this.postsService.updateComment(
      postId,
      commentId,
      updateCommentDto,
      userId.toString(),
    );
  }

  @ApiOperation({
    summary: 'Delete any comment (Admin)',
    description: 'Soft delete any comment. Admin can delete any comment.',
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete(':postId/comments/:commentId')
  async adminDeleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    // Admin bypass - can delete any comment
    const userId = req.user._id || req.user.id;
    return this.postsService.removeComment(postId, commentId, userId.toString());
  }

  @ApiOperation({
    summary: 'Hard delete comment (Admin)',
    description: 'Permanently delete a comment from the database. Admin only.',
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted permanently' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete(':commentId/hard')
  async hardDeleteComment(@Param('commentId') commentId: string) {
    await this.postsService['commentModel'].findByIdAndDelete(commentId);
    return { message: 'Comment permanently deleted', success: true };
  }

  @ApiOperation({
    summary: 'Restore deleted comment (Admin)',
    description: 'Restore a soft-deleted comment. Admin only.',
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment restored successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Post(':commentId/restore')
  async restoreComment(@Param('commentId') commentId: string) {
    const comment = await this.postsService['commentModel'].findByIdAndUpdate(
      commentId,
      { deletedAt: null },
      { new: true },
    );

    if (!comment) {
      throw new Error('Comment not found');
    }

    return { message: 'Comment restored successfully', comment };
  }

  @ApiOperation({
    summary: 'Bulk delete comments (Admin)',
    description: 'Delete multiple comments at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Comments deleted successfully' })
  @Post('bulk/delete')
  async bulkDelete(
    @Body() body: { commentIds: string[] },
  ) {
    const result = await this.postsService['commentModel'].updateMany(
      { _id: { $in: body.commentIds } },
      { deletedAt: new Date() },
    );

    return {
      message: 'Comments deleted successfully',
      modifiedCount: result.modifiedCount,
    };
  }

  @ApiOperation({
    summary: 'Bulk hard delete comments (Admin)',
    description: 'Permanently delete multiple comments at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Comments permanently deleted' })
  @Delete('bulk/hard')
  async bulkHardDelete(
    @Body() body: { commentIds: string[] },
  ) {
    const result = await this.postsService['commentModel'].deleteMany(
      { _id: { $in: body.commentIds } },
    );

    return {
      message: 'Comments permanently deleted',
      deletedCount: result.deletedCount,
    };
  }
}

