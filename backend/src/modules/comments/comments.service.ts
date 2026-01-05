import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './schema/comment.schema';
import { Course } from '../courses/schema/course.schema';
import { User } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    // Validate that either testId or courseId is provided
    if (!createCommentDto.testId && !createCommentDto.courseId) {
      throw new BadRequestException('Either testId or courseId must be provided');
    }

    // If both are provided, that's also invalid
    if (createCommentDto.testId && createCommentDto.courseId) {
      throw new BadRequestException('Only one of testId or courseId should be provided');
    }

    // Convert string IDs to ObjectId
    const commentData: any = {
      userId: new Types.ObjectId(createCommentDto.userId),
      content: createCommentDto.content,
    };

    if (createCommentDto.testId) {
      commentData.testId = new Types.ObjectId(createCommentDto.testId);
    }

    if (createCommentDto.courseId) {
      commentData.courseId = new Types.ObjectId(createCommentDto.courseId);
    }

    if (createCommentDto.rating) {
      commentData.rating = createCommentDto.rating;
    }

    const newComment = await this.commentModel.create(commentData);
    
    // If it's a course review, update the course's numReview count
    if (createCommentDto.courseId) {
      await this.courseModel.findByIdAndUpdate(createCommentDto.courseId, {
        $inc: { numReview: 1 },
      });
    }

    return newComment;
  }

  async findAll() {
    return await this.commentModel
      .find({ deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .populate('testId', 'title language level')
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.commentModel
      .findById(id)
      .populate('userId', 'name email avatar_url')
      .populate('testId', 'title language level')
      .populate('courseId', 'title category')
      .exec();
  }

  async findByTestId(testId: string) {
    // Lấy tất cả comments của một test
    return await this.commentModel
      .find({ testId: new Types.ObjectId(testId), deletedAt: null })
      .populate('userId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string) {
    // Lấy tất cả comments của một user
    return await this.commentModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: null })
      .populate('testId', 'title language level')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    return await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Get comment before soft delete to check if it's a course review
    const comment = await this.commentModel.findById(id).exec();
    
    // Soft delete
    const deletedComment = await this.commentModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();

    // If it's a course review, decrement the course's numReview count
    if (comment && comment.courseId) {
      await this.courseModel.findByIdAndUpdate(comment.courseId, {
        $inc: { numReview: -1 },
      });
    }

    return deletedComment;
  }

  async findByCourseId(courseId: string) {
    // Get all comments/reviews for a course
    const comments = await this.commentModel
      .find({ courseId: new Types.ObjectId(courseId), deletedAt: null })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Populate userId manually to handle both ObjectId and string cases
    const populatedComments = await Promise.all(
      comments.map(async (comment: any) => {
        let user: any = null;
        try {
          // Try to populate if userId is ObjectId
          if (comment.userId && Types.ObjectId.isValid(comment.userId)) {
            const userIdObj = comment.userId instanceof Types.ObjectId 
              ? comment.userId 
              : new Types.ObjectId(comment.userId);
            user = await this.userModel.findById(userIdObj).select('name email avatar_url').lean().exec();
          }
        } catch (error) {
          console.error('Error populating user:', error);
        }

        return {
          ...comment,
          user: user || null,
        };
      })
    );

    return populatedComments;
  }

  async getCourseAverageRating(courseId: string) {
    // Calculate average rating from comments
    const result = await this.commentModel.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId), deletedAt: null, rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: result[0].totalReviews,
    };
  }

  async getCourseReviewCount(courseId: string) {
    return await this.commentModel.countDocuments({
      courseId,
      deletedAt: null,
    });
  }

  async hardDelete(id: string) {
    // Xóa thật sự khỏi database
    return await this.commentModel.findByIdAndDelete(id).exec();
  }
}
