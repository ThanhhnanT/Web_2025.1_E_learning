import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { PostComment } from './schema/comment.schema';
import { PostLike } from './schema/post-like.schema';
import { PostReaction } from './schema/post-reaction.schema';
import { CommentReaction } from './schema/comment-reaction.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { CreatePostCommentDto } from './dto/create-comment.dto';
import { UpdatePostCommentDto } from './dto/update-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { CloudinaryService } from '../users/cloudinary.service';
import { PostsGateway } from './posts.gateway';
import { UsersService } from '../users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(PostComment.name) private commentModel: Model<PostComment>,
    @InjectModel(PostLike.name) private postLikeModel: Model<PostLike>,
    @InjectModel(PostReaction.name) private postReactionModel: Model<PostReaction>,
    @InjectModel(CommentReaction.name)
    private commentReactionModel: Model<CommentReaction>,
    private cloudinaryService: CloudinaryService,
    private postsGateway: PostsGateway,
    private usersService: UsersService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string, file?: Express.Multer.File) {
    let imageUrl = createPostDto.imageUrl;

    // Upload image to Cloudinary if file is provided
    if (file) {
      try {
        imageUrl = await this.cloudinaryService.uploadImage(file, 'posts');
      } catch (error) {
        throw new BadRequestException('Failed to upload image');
      }
    }

    const newPost = await this.postModel.create({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
      imageUrl,
    });

    const populatedPost = await this.findOne(newPost._id.toString(), userId);
    this.postsGateway.emitPostCreated(populatedPost);
    return populatedPost;
  }

  async findAll(queryDto: QueryPostsDto, userId?: string) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const posts = await this.postModel
      .find({ deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Get like status and reactions for each post if user is authenticated
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const postObj = post as any;
        let likedByCurrentUser = false;

        if (userId) {
          const like = await this.postLikeModel.findOne({
            postId: post._id,
            userId: new Types.ObjectId(userId),
          });
          likedByCurrentUser = !!like;
        }

        // Get reactions for this post
        const reactions = await this.getPostReactions(post._id.toString(), userId);

        // Map userId to user for frontend compatibility
        const user = postObj.userId || {};
        return {
          ...postObj,
          id: postObj._id.toString(),
          user: {
            id: user._id?.toString() || user.id || '',
            name: user.name || '',
            avatar_url: user.avatar_url || user.avatar || '',
          },
          likedByCurrentUser,
          reactions,
        };
      }),
    );

    const total = await this.postModel.countDocuments({ deletedAt: null });

    return {
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const post = await this.postModel
      .findById(id)
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    let likedByCurrentUser = false;
    if (userId) {
      const like = await this.postLikeModel.findOne({
        postId: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      });
      likedByCurrentUser = !!like;
    }

    // Map userId to user for frontend compatibility
    const user = (post as any).userId || {};
    return {
      ...post,
      id: post._id.toString(),
      user: {
        id: user._id?.toString() || user.id || '',
        name: user.name || '',
        avatar_url: user.avatar_url || user.avatar || '',
      },
      likedByCurrentUser,
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string, file?: Express.Multer.File) {
    const post = await this.postModel.findById(id);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is admin (admin bypass)
    const currentUser = await this.usersService.findOne(userId);
    const isAdmin = currentUser?.role === 'administrator';

    // Only owner or admin can update
    if (post.userId.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own posts or need administrator role');
    }

    let imageUrl = updatePostDto.imageUrl;

    // Upload new image if provided
    if (file) {
      try {
        imageUrl = await this.cloudinaryService.uploadImage(file, 'posts');
      } catch (error) {
        throw new BadRequestException('Failed to upload image');
      }
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(
        id,
        { ...updatePostDto, ...(imageUrl && { imageUrl }) },
        { new: true },
      )
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    // Map userId to user for frontend compatibility
    const postUser = (updatedPost as any).userId || {};
    const result = {
      ...updatedPost,
      id: updatedPost._id.toString(),
      user: {
        id: postUser._id?.toString() || postUser.id || '',
        name: postUser.name || '',
        avatar_url: postUser.avatar_url || '',
      },
    };
    this.postsGateway.emitPostUpdated(result);
    return result;
  }

  async updateStatus(id: string, updateStatusDto: UpdatePostStatusDto, userId: string) {
    const post = await this.postModel.findById(id);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is admin (admin bypass)
    const currentUser = await this.usersService.findOne(userId);
    const isAdmin = currentUser?.role === 'administrator';

    if (!isAdmin) {
      throw new ForbiddenException('Only administrator can update post status');
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(
        id,
        { status: updateStatusDto.status },
        { new: true },
      )
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    // Map userId to user for frontend compatibility
    const userData = (updatedPost as any).userId || {};
    const result = {
      ...updatedPost,
      id: updatedPost._id.toString(),
      user: {
        id: userData._id?.toString() || userData.id || '',
        name: userData.name || '',
        avatar_url: userData.avatar_url || '',
      },
    };
    this.postsGateway.emitPostUpdated(result);
    return result;
  }

  async remove(id: string, userId: string) {
    const post = await this.postModel.findById(id);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is admin (admin bypass)
    const currentUser = await this.usersService.findOne(userId);
    const isAdmin = currentUser?.role === 'administrator';

    // Only owner or admin can delete
    if (post.userId.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts or need administrator role');
    }

    await this.postModel.findByIdAndUpdate(id, { deletedAt: new Date() });

    this.postsGateway.emitPostDeleted(id);
    return { message: 'Post deleted successfully' };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.postLikeModel.findOne({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });

    if (existingLike) {
      // Unlike
      await this.postLikeModel.findByIdAndDelete(existingLike._id);
      await this.postModel.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
      const updatedPost = await this.postModel.findById(postId);
      const result = { 
        liked: false, 
        likes: updatedPost?.likes || post.likes - 1,
        userId: userId // Include userId so frontend knows who liked
      };
      this.postsGateway.emitPostLiked(postId, result);
      return { liked: false, likes: updatedPost?.likes || post.likes - 1 };
    } else {
      // Like
      await this.postLikeModel.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      });
      await this.postModel.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
      const updatedPost = await this.postModel.findById(postId);
      const result = { 
        liked: true, 
        likes: updatedPost?.likes || post.likes + 1,
        userId: userId // Include userId so frontend knows who liked
      };
      this.postsGateway.emitPostLiked(postId, result);
      return { liked: true, likes: updatedPost?.likes || post.likes + 1 };
    }
  }

  async getPostLikes(postId: string) {
    const likes = await this.postLikeModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return likes.map((like) => ({
      ...like,
      id: like._id.toString(),
      userId: {
        ...like.userId,
        id: (like.userId as any)._id.toString(),
      },
    }));
  }

  async getPostReactions(postId: string, userId?: string) {
    const reactions = await this.postReactionModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    // Group by emoji
    const grouped: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }> = {};

    reactions.forEach((reaction) => {
      const emoji = reaction.emoji;
      if (!grouped[emoji]) {
        grouped[emoji] = {
          count: 0,
          users: [],
          likedByCurrentUser: false,
        };
      }
      grouped[emoji].count++;
      grouped[emoji].users.push({
        id: (reaction.userId as any)._id.toString(),
        name: (reaction.userId as any).name,
        avatar_url: (reaction.userId as any).avatar_url,
      });

      if (userId && (reaction.userId as any)._id.toString() === userId) {
        grouped[emoji].likedByCurrentUser = true;
      }
    });

    return grouped;
  }

  async reactToPost(
    postId: string,
    createReactionDto: CreateReactionDto,
    userId: string,
  ) {
    const post = await this.postModel.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Find existing reaction with same emoji
    const existingReaction = await this.postReactionModel.findOne({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
      emoji: createReactionDto.emoji,
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await this.postReactionModel.findByIdAndDelete(existingReaction._id);
      const result = { reacted: false, emoji: createReactionDto.emoji };
      this.postsGateway.emitPostReaction(postId, result);
      return result;
    } else {
      // Remove all other reactions from this user (only 1 react per user)
      await this.postReactionModel.deleteMany({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      });
      
      // Add new reaction
      await this.postReactionModel.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        emoji: createReactionDto.emoji,
      });
      const result = { reacted: true, emoji: createReactionDto.emoji, userId };
      this.postsGateway.emitPostReaction(postId, result);
      return { reacted: true, emoji: createReactionDto.emoji };
    }
  }

  // Comments methods
  async getComments(postId: string, userId?: string) {
    const post = await this.postModel.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Get all top-level comments (no parentId)
    const topLevelComments = await this.commentModel
      .find({
        postId: new Types.ObjectId(postId),
        parentId: { $exists: false },
        deletedAt: null,
      })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Build nested structure
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await this.getReplies(comment._id.toString(), userId);
        const reactions = await this.getCommentReactions(comment._id.toString(), userId);

        // Check if user has liked any reaction
        const hasLiked = Object.values(reactions).some(
          (reaction) => reaction.likedByCurrentUser,
        );

        // Map userId to user for frontend compatibility
        const user = (comment as any).userId || {};
        // Ensure content is explicitly extracted and is a string
        const content = typeof comment.content === 'string' ? comment.content : String(comment.content || '');
        const commentAny = comment as any;
        return {
          id: comment._id.toString(),
          content: content,
          createdAt: commentAny.createdAt || new Date(),
          updatedAt: commentAny.updatedAt || new Date(),
          imageUrl: comment.imageUrl,
          user: {
            id: user._id?.toString() || user.id || '',
            name: user.name || '',
            avatar_url: user.avatar_url || user.avatar || '',
          },
          replies,
          reactions,
          likedByCurrentUser: hasLiked,
        };
      }),
    );

    return commentsWithReplies;
  }

  async getReplies(commentId: string, userId?: string): Promise<any[]> {
    const replies = await this.commentModel
      .find({
        parentId: new Types.ObjectId(commentId),
        deletedAt: null,
      })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return Promise.all(
      replies.map(async (reply) => {
        const reactions = await this.getCommentReactions(reply._id.toString(), userId);
        // Check if user has liked any reaction
        const hasLiked = Object.values(reactions).some(
          (reaction) => reaction.likedByCurrentUser,
        );
        // Map userId to user for frontend compatibility
        const user = (reply as any).userId || {};
        // Ensure content is explicitly extracted and is a string
        const content = typeof reply.content === 'string' ? reply.content : String(reply.content || '');
        const replyAny = reply as any;
        return {
          id: reply._id.toString(),
          content: content,
          createdAt: replyAny.createdAt || new Date(),
          updatedAt: replyAny.updatedAt || new Date(),
          imageUrl: reply.imageUrl,
          user: {
            id: user._id?.toString() || user.id || '',
            name: user.name || '',
            avatar_url: user.avatar_url || user.avatar || '',
          },
          replies: [], // Replies don't have nested replies in this implementation
          reactions,
          likedByCurrentUser: hasLiked,
        };
      }),
    );
  }

  async getCommentReactions(commentId: string, userId?: string) {
    const reactions = await this.commentReactionModel
      .find({ commentId: new Types.ObjectId(commentId) })
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    // Group by emoji
    const grouped: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }> = {};

    reactions.forEach((reaction) => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = {
          count: 0,
          users: [],
          likedByCurrentUser: false,
        };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push({
        ...reaction.userId,
        id: (reaction.userId as any)._id.toString(),
      });

      if (userId && (reaction.userId as any)._id.toString() === userId) {
        grouped[reaction.emoji].likedByCurrentUser = true;
      }
    });

    return grouped;
  }

  async createComment(postId: string, createCommentDto: CreatePostCommentDto, userId: string, file?: Express.Multer.File) {
    try {
      // Validate userId
      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const post = await this.postModel.findById(postId);

      if (!post || post.deletedAt) {
        throw new NotFoundException('Post not found');
      }

      // If parentId is provided, verify it exists and find the root comment
      let rootParentId = createCommentDto.parentId;
      if (createCommentDto.parentId) {
        const parentComment = await this.commentModel.findById(createCommentDto.parentId);
        if (!parentComment || parentComment.deletedAt) {
          throw new NotFoundException('Parent comment not found');
        }
        if (parentComment.postId.toString() !== postId) {
          throw new BadRequestException('Parent comment does not belong to this post');
        }
        
        // If parent comment itself is a reply, find the root comment (top-level)
        // This ensures all replies are at the same level (flat structure)
        if (parentComment.parentId) {
          // Find the root comment by traversing up
          let currentComment = parentComment;
          while (currentComment.parentId) {
            const rootComment = await this.commentModel.findById(currentComment.parentId);
            if (!rootComment || rootComment.deletedAt) {
              break;
            }
            currentComment = rootComment;
          }
          rootParentId = currentComment._id.toString();
        }
      }

      // Upload image if provided
      let imageUrl: string | undefined;
      if (file) {
        imageUrl = await this.cloudinaryService.uploadImage(file, 'posts/comments');
      }
      
      const newComment = await this.commentModel.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        content: createCommentDto.content,
        ...(imageUrl && { imageUrl }),
        ...(rootParentId && { parentId: new Types.ObjectId(rootParentId) }),
      });

      // Update root parent comment replies count if it's a reply
      if (rootParentId) {
        await this.commentModel.findByIdAndUpdate(rootParentId, {
          $inc: { repliesCount: 1 },
        });
      }

      // Update post comments count
      await this.postModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

      // Try to populate user, with fallback
      let populatedComment: any;
      try {
        populatedComment = await this.commentModel
          .findById(newComment._id)
          .populate({
            path: 'userId',
            select: 'name email avatar_url',
          })
          .lean()
          .exec();
      } catch (populateError) {
        console.error('Populate error:', populateError);
        // If populate fails, get comment without populate
        populatedComment = await this.commentModel.findById(newComment._id).lean().exec();
      }

      if (!populatedComment) {
        throw new NotFoundException('Comment not found after creation');
      }

      // Map userId to user for frontend compatibility
      const user = (populatedComment as any).userId;
      
      // Handle case where user might not be populated (could be null if user doesn't exist)
      let userData: any = {};
      if (user && (user._id || user.id)) {
        userData = user;
      } else {
        // If populate failed or user doesn't exist, create a minimal user object
        // This should not happen if populate works correctly, but we handle it gracefully
        userData = {
          _id: new Types.ObjectId(userId),
          name: 'Unknown User',
          avatar_url: '',
        };
        console.warn(`User ${userId} not found when populating comment`);
      }

      // Ensure content is explicitly extracted and is a string
      const content = typeof populatedComment.content === 'string' ? populatedComment.content : String(populatedComment.content || '');
      const populatedCommentAny = populatedComment as any;
      const result = {
        id: populatedComment._id.toString(),
        content: content,
        createdAt: populatedCommentAny.createdAt || new Date(),
        updatedAt: populatedCommentAny.updatedAt || new Date(),
        imageUrl: populatedComment.imageUrl,
        parentId: populatedCommentAny.parentId ? populatedCommentAny.parentId.toString() : undefined,
        user: {
          id: userData._id?.toString() || userData.id || userId,
          name: userData.name || 'Unknown User',
          avatar_url: userData.avatar_url || userData.avatar || '',
        },
        replies: [],
        reactions: {},
        likedByCurrentUser: false,
      };
      this.postsGateway.emitCommentCreated(postId, result);
      return result;
    } catch (error) {
      console.error('Error in createComment:', error);
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(`Failed to create comment: ${error.message || 'Unknown error'}`);
    }
  }

  async updateComment(
    postId: string,
    commentId: string,
    updateCommentDto: UpdatePostCommentDto,
    userId: string,
  ) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.postId.toString() !== postId) {
      throw new BadRequestException('Comment does not belong to this post');
    }

    // Check if user is admin (admin bypass)
    const currentUser = await this.usersService.findOne(userId);
    const isAdmin = currentUser?.role === 'administrator';

    // Only owner or admin can update
    if (comment.userId.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own comments or need administrator role');
    }

    const updatedComment = await this.commentModel
      .findByIdAndUpdate(commentId, updateCommentDto, { new: true })
      .populate('userId', 'name email avatar_url')
      .lean()
      .exec();

    if (!updatedComment) {
      throw new NotFoundException('Comment not found');
    }

    // Map userId to user for frontend compatibility
    const user = (updatedComment as any).userId || {};
    // Ensure content is explicitly extracted and is a string
    const content = typeof updatedComment.content === 'string' ? updatedComment.content : String(updatedComment.content || '');
    const updatedCommentAny = updatedComment as any;
    const result = {
      id: updatedComment._id.toString(),
      content: content,
      createdAt: updatedCommentAny.createdAt || new Date(),
      updatedAt: updatedCommentAny.updatedAt || new Date(),
      imageUrl: updatedComment.imageUrl,
      user: {
        id: user._id?.toString() || user.id || '',
        name: user.name || '',
        avatar_url: user.avatar_url || user.avatar || '',
      },
    };
    this.postsGateway.emitCommentUpdated(postId, result);
    return result;
  }

  async removeComment(postId: string, commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.postId.toString() !== postId) {
      throw new BadRequestException('Comment does not belong to this post');
    }

    // Check if user is admin (admin bypass)
    const currentUser = await this.usersService.findOne(userId);
    const isAdmin = currentUser?.role === 'administrator';

    // Only owner or admin can delete
    if (comment.userId.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments or need administrator role');
    }

    await this.commentModel.findByIdAndUpdate(commentId, { deletedAt: new Date() });

    // Update parent comment replies count if it's a reply
    if (comment.parentId) {
      await this.commentModel.findByIdAndUpdate(comment.parentId, {
        $inc: { repliesCount: -1 },
      });
    }

    // Update post comments count
    await this.postModel.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });

    this.postsGateway.emitCommentDeleted(postId, commentId);
    return { message: 'Comment deleted successfully' };
  }

  async reactToComment(
    postId: string,
    commentId: string,
    createReactionDto: CreateReactionDto,
    userId: string,
  ) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.postId.toString() !== postId) {
      throw new BadRequestException('Comment does not belong to this post');
    }

    const existingReaction = await this.commentReactionModel.findOne({
      commentId: new Types.ObjectId(commentId),
      userId: new Types.ObjectId(userId),
      emoji: createReactionDto.emoji,
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await this.commentReactionModel.findByIdAndDelete(existingReaction._id);
      const result = { reacted: false, emoji: createReactionDto.emoji };
      this.postsGateway.emitCommentReaction(postId, commentId, result);
      return result;
    } else {
      // Remove all other reactions from this user (only 1 react per user)
      await this.commentReactionModel.deleteMany({
        commentId: new Types.ObjectId(commentId),
        userId: new Types.ObjectId(userId),
      });
      
      // Add new reaction
      await this.commentReactionModel.create({
        commentId: new Types.ObjectId(commentId),
        userId: new Types.ObjectId(userId),
        emoji: createReactionDto.emoji,
      });
      const result = { reacted: true, emoji: createReactionDto.emoji, userId };
      this.postsGateway.emitCommentReaction(postId, commentId, result);
      return { reacted: true, emoji: createReactionDto.emoji };
    }
  }
}

