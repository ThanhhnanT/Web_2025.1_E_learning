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
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';

@ApiTags('Admin Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/posts')
export class PostsAdminController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: 'Get all posts (Admin)',
    description: 'Get all posts with filters including deleted posts. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'pending', 'reported', 'archived'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @Get()
  async getAllPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    
    // Include deleted posts if requested
    if (includeDeleted !== 'true') {
      filter.deletedAt = null;
    }

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Search in content
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const [posts, total] = await Promise.all([
      this.postsService['postModel']
        .find(filter)
        .populate('userId', 'name email avatar_url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      this.postsService['postModel'].countDocuments(filter),
    ]);

    return {
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @ApiOperation({
    summary: 'Get reported posts (Admin)',
    description: 'Get all posts that have been reported. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Reported posts retrieved successfully' })
  @Get('reported')
  async getReportedPosts() {
    const posts = await this.postsService['postModel']
      .find({ status: 'reported', deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      data: posts,
      count: posts.length,
    };
  }

  @ApiOperation({
    summary: 'Get post statistics (Admin)',
    description: 'Get statistics about posts. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @Get('statistics')
  async getPostStatistics() {
    const [total, active, pending, reported, archived, deleted] = await Promise.all([
      this.postsService['postModel'].countDocuments(),
      this.postsService['postModel'].countDocuments({ status: 'active', deletedAt: null }),
      this.postsService['postModel'].countDocuments({ status: 'pending', deletedAt: null }),
      this.postsService['postModel'].countDocuments({ status: 'reported', deletedAt: null }),
      this.postsService['postModel'].countDocuments({ status: 'archived', deletedAt: null }),
      this.postsService['postModel'].countDocuments({ deletedAt: { $ne: null } }),
    ]);

    return {
      total,
      active,
      pending,
      reported,
      archived,
      deleted,
    };
  }

  @ApiOperation({
    summary: 'Edit any post (Admin)',
    description: 'Admin can edit any post regardless of ownership.',
  })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch(':id')
  async adminUpdatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: any,
  ) {
    // Admin bypass - can edit any post
    const userId = req.user._id || req.user.id;
    return this.postsService.update(id, updatePostDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Moderate post (Admin)',
    description: 'Update post status for moderation purposes. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post moderated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch(':id/moderate')
  async moderatePost(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePostStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user._id || req.user.id;
    return this.postsService.updateStatus(id, updateStatusDto, userId.toString());
  }

  @ApiOperation({
    summary: 'Hard delete post (Admin)',
    description: 'Permanently delete a post from the database. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted permanently' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Delete(':id/hard')
  async hardDeletePost(@Param('id') id: string) {
    await this.postsService['postModel'].findByIdAndDelete(id);
    return { message: 'Post permanently deleted', success: true };
  }

  @ApiOperation({
    summary: 'Delete any post (Admin)',
    description: 'Soft delete any post. Admin can delete any post.',
  })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Delete(':id')
  async adminDeletePost(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    // Admin bypass - can delete any post
    const userId = req.user._id || req.user.id;
    return this.postsService.remove(id, userId.toString());
  }

  @ApiOperation({
    summary: 'Restore deleted post (Admin)',
    description: 'Restore a soft-deleted post. Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post restored successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':id/restore')
  async restorePost(@Param('id') id: string) {
    const post = await this.postsService['postModel'].findByIdAndUpdate(
      id,
      { deletedAt: null, status: 'active' },
      { new: true },
    );

    if (!post) {
      throw new Error('Post not found');
    }

    return { message: 'Post restored successfully', post };
  }

  @ApiOperation({
    summary: 'Bulk moderate posts (Admin)',
    description: 'Moderate multiple posts at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Posts moderated successfully' })
  @Post('bulk/moderate')
  async bulkModerate(
    @Body() body: { postIds: string[]; status: string },
  ) {
    const result = await this.postsService['postModel'].updateMany(
      { _id: { $in: body.postIds } },
      { status: body.status },
    );

    return {
      message: 'Posts moderated successfully',
      modifiedCount: result.modifiedCount,
    };
  }

  @ApiOperation({
    summary: 'Bulk delete posts (Admin)',
    description: 'Delete multiple posts at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Posts deleted successfully' })
  @Post('bulk/delete')
  async bulkDelete(
    @Body() body: { postIds: string[] },
  ) {
    const result = await this.postsService['postModel'].updateMany(
      { _id: { $in: body.postIds } },
      { deletedAt: new Date() },
    );

    return {
      message: 'Posts deleted successfully',
      modifiedCount: result.modifiedCount,
    };
  }

  @ApiOperation({
    summary: 'Bulk hard delete posts (Admin)',
    description: 'Permanently delete multiple posts at once. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Posts permanently deleted' })
  @Delete('bulk/hard')
  async bulkHardDelete(
    @Body() body: { postIds: string[] },
  ) {
    const result = await this.postsService['postModel'].deleteMany(
      { _id: { $in: body.postIds } },
    );

    return {
      message: 'Posts permanently deleted',
      deletedCount: result.deletedCount,
    };
  }
}

