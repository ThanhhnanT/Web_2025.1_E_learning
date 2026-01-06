import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AdminGuard } from '@/auth/admin.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Post } from '../posts/schema/post.schema';
import { PostComment } from '../posts/schema/comment.schema';
import { Course } from '../courses/schema/course.schema';
import { Enrollment } from '../enrollments/schema/enrollment.schema';
import { Test } from '../tests/schema/test.schema';
import { Result } from '../results/schema/result.schema';
import { FlashcardDeck } from '../flashcards/schema/flashcard-deck.schema';
import { Flashcard } from '../flashcards/schema/flashcard.schema';

@ApiTags('Admin Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/statistics')
export class StatisticsAdminController {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(PostComment.name) private commentModel: Model<PostComment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Test.name) private testModel: Model<Test>,
    @InjectModel(Result.name) private resultModel: Model<Result>,
    @InjectModel(FlashcardDeck.name) private flashcardDeckModel: Model<FlashcardDeck>,
    @InjectModel(Flashcard.name) private flashcardModel: Model<Flashcard>,
  ) {}

  @ApiOperation({
    summary: 'Get platform overview statistics (Admin)',
    description: 'Get overall platform statistics including users, courses, posts, etc. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @Get('overview')
  async getOverviewStatistics() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      administratorUsers,
      viewerUsers,
      activeUsers7Days,
      activeUsers30Days,
      totalCourses,
      totalEnrollments,
      totalPosts,
      activePosts,
      totalComments,
      totalTests,
      totalTestAttempts,
      totalFlashcardDecks,
      totalFlashcards,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: 'administrator' }),
      this.userModel.countDocuments({ role: 'viewer' }),
      this.userModel.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
      this.userModel.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      this.courseModel.countDocuments(),
      this.enrollmentModel.countDocuments(),
      this.postModel.countDocuments(),
      this.postModel.countDocuments({ deletedAt: null, status: 'active' }),
      this.commentModel.countDocuments({ deletedAt: null }),
      this.testModel.countDocuments(),
      this.resultModel.countDocuments(),
      this.flashcardDeckModel.countDocuments(),
      this.flashcardModel.countDocuments(),
    ]);

    return {
      users: {
        total: totalUsers,
        byRole: {
          administrator: administratorUsers,
          viewer: viewerUsers,
        },
        active: {
          last7Days: activeUsers7Days,
          last30Days: activeUsers30Days,
        },
      },
      courses: {
        total: totalCourses,
        totalEnrollments,
      },
      posts: {
        total: totalPosts,
        active: activePosts,
        totalComments,
      },
      tests: {
        total: totalTests,
        totalAttempts: totalTestAttempts,
      },
      flashcards: {
        totalDecks: totalFlashcardDecks,
        totalCards: totalFlashcards,
      },
    };
  }

  @ApiOperation({
    summary: 'Get user growth statistics (Admin)',
    description: 'Get user registration and growth trends over time. Admin only.',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back (default: 30)' })
  @ApiResponse({ status: 200, description: 'User growth statistics retrieved' })
  @Get('users/growth')
  async getUserGrowth(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const usersByDate = await this.userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      data: usersByDate.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };
  }

  @ApiOperation({
    summary: 'Get content creation statistics (Admin)',
    description: 'Get statistics about posts and comments creation. Admin only.',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back (default: 30)' })
  @ApiResponse({ status: 200, description: 'Content statistics retrieved' })
  @Get('content/trends')
  async getContentTrends(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const [postsByDate, commentsByDate] = await Promise.all([
      this.postModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
      this.commentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    return {
      posts: postsByDate.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      comments: commentsByDate.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };
  }

  @ApiOperation({
    summary: 'Get most active users (Admin)',
    description: 'Get users with most posts, comments, or other activity. Admin only.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of users to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Most active users retrieved' })
  @Get('users/most-active')
  async getMostActiveUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;

    const topPosters = await this.postModel.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: {
          _id: '$userId',
          postCount: { $sum: 1 },
        },
      },
      {
        $sort: { postCount: -1 },
      },
      {
        $limit: limitNum,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          postCount: 1,
          name: '$user.name',
          email: '$user.email',
          avatar_url: '$user.avatar_url',
        },
      },
    ]);

    return {
      topPosters,
    };
  }

  @ApiOperation({
    summary: 'Get popular courses (Admin)',
    description: 'Get courses with most enrollments. Admin only.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of courses to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Popular courses retrieved' })
  @Get('courses/popular')
  async getPopularCourses(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;

    const popularCourses = await this.enrollmentModel.aggregate([
      {
        $group: {
          _id: '$courseId',
          enrollmentCount: { $sum: 1 },
        },
      },
      {
        $sort: { enrollmentCount: -1 },
      },
      {
        $limit: limitNum,
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $unwind: '$course',
      },
      {
        $project: {
          courseId: '$_id',
          enrollmentCount: 1,
          title: '$course.title',
          category: '$course.category',
          price: '$course.price',
        },
      },
    ]);

    return {
      popularCourses,
    };
  }

  @ApiOperation({
    summary: 'Get learning statistics (Admin)',
    description: 'Get overall learning statistics including completion rates. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Learning statistics retrieved' })
  @Get('learning/overview')
  async getLearningStatistics() {
    const [
      completedEnrollments,
      activeEnrollments,
      averageTestScore,
      totalFlashcardReviews,
    ] = await Promise.all([
      this.enrollmentModel.countDocuments({ status: 'completed' }),
      this.enrollmentModel.countDocuments({ status: 'active' }),
      this.resultModel.aggregate([
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$score' },
          },
        },
      ]),
      this.flashcardModel.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: '$reviewCount' },
          },
        },
      ]),
    ]);

    return {
      enrollments: {
        completed: completedEnrollments,
        active: activeEnrollments,
        completionRate: activeEnrollments > 0 
          ? (completedEnrollments / (completedEnrollments + activeEnrollments)) * 100 
          : 0,
      },
      tests: {
        averageScore: averageTestScore[0]?.averageScore || 0,
      },
      flashcards: {
        totalReviews: totalFlashcardReviews[0]?.totalReviews || 0,
      },
    };
  }

  @ApiOperation({
    summary: 'Get recent activity (Admin)',
    description: 'Get recent platform activity (registrations, posts, enrollments). Admin only.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per category (default: 5)' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved' })
  @Get('activity/recent')
  async getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 5;

    const [recentUsers, recentPosts, recentEnrollments] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .select('name email role createdAt')
        .lean()
        .exec(),
      this.postModel
        .find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .populate('userId', 'name email')
        .select('content userId createdAt')
        .lean()
        .exec(),
      this.enrollmentModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .populate('userId', 'name email')
        .populate('courseId', 'title')
        .select('userId courseId createdAt')
        .lean()
        .exec(),
    ]);

    return {
      recentRegistrations: recentUsers,
      recentPosts,
      recentEnrollments,
    };
  }
}

