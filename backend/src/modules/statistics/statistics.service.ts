import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Result } from '../results/schema/result.schema';
import { Payment } from '../payments/schema/payment.schema';
import { FlashcardProgress } from '../flashcards/schema/flashcard-progress.schema';
import { Course } from '../courses/schema/course.schema';
import { UserStatisticsDto, TestStatsDto, CourseStatsDto, FlashcardStatsDto, OverviewDto } from './dto/user-statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Result.name) private resultModel: Model<Result>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(FlashcardProgress.name) private flashcardProgressModel: Model<FlashcardProgress>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
  ) {}

  async getUserStatistics(userId: string): Promise<UserStatisticsDto> {
    const userIdObj = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

    // Get all statistics in parallel
    const [testStats, courseStats, flashcardStats] = await Promise.all([
      this.getTestStatistics(userIdObj),
      this.getCourseStatistics(userIdObj),
      this.getFlashcardStatistics(userIdObj),
    ]);

    // Build overview
    const overview: OverviewDto = {
      totalTests: testStats.totalAttempts,
      averageScore: testStats.averageScore,
      bestScore: testStats.bestScore,
      totalCourses: courseStats.enrolled,
      activeCourses: courseStats.inProgress,
      totalFlashcardDecks: flashcardStats.totalDecks,
      totalWordsLearned: flashcardStats.totalWordsLearned + flashcardStats.totalWordsRemembered,
    };

    return {
      overview,
      testStats,
      courseStats,
      flashcardStats,
    };
  }

  async getTestStatistics(userId: string | Types.ObjectId): Promise<TestStatsDto> {
    const results = await this.resultModel
      .find({ userId, deletedAt: null })
      .populate('testId', 'title language level')
      .sort({ completedAt: -1 })
      .exec();

    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        byLanguage: {},
        byLevel: {},
        recentResults: [],
      };
    }

    const scores = results.map(r => r.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Group by language
    const byLanguage: { [key: string]: number } = {};
    results.forEach(result => {
      const test = result.testId as any;
      if (test && test.language) {
        byLanguage[test.language] = (byLanguage[test.language] || 0) + 1;
      }
    });

    // Group by level
    const byLevel: { [key: string]: number } = {};
    results.forEach(result => {
      const test = result.testId as any;
      if (test && test.level) {
        byLevel[test.level] = (byLevel[test.level] || 0) + 1;
      }
    });

    // Get recent results (last 10)
    const recentResults = results.slice(0, 10).map(r => ({
      _id: r._id,
      testId: r.testId,
      score: r.score,
      bandScore: r.bandScore,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
      timeSpent: r.timeSpent,
      completedAt: r.completedAt,
    }));

    return {
      totalAttempts: results.length,
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore,
      worstScore,
      byLanguage,
      byLevel,
      recentResults,
    };
  }

  async getCourseStatistics(userId: string | Types.ObjectId): Promise<CourseStatsDto> {
    const payments = await this.paymentModel
      .find({ userId, status: 'completed' })
      .populate('courseId', 'title description language level thumbnail_url')
      .exec();

    const enrolled = payments.length;
    const completed = payments.length; // Assuming completed payment means enrolled
    const inProgress = enrolled; // Can be enhanced with course progress tracking

    const courses = payments.map(p => ({
      _id: p.courseId,
      paymentId: p._id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      course: p.courseId,
    }));

    return {
      enrolled,
      completed,
      inProgress,
      courses,
    };
  }

  async getFlashcardStatistics(userId: string | Types.ObjectId): Promise<FlashcardStatsDto> {
    const progressList = await this.flashcardProgressModel
      .find({ userId })
      .populate('deckId', 'name description wordCount')
      .exec();

    const totalDecks = progressList.length;
    let totalWordsLearned = 0;
    let totalWordsRemembered = 0;
    let totalWordsToReview = 0;

    progressList.forEach(progress => {
      totalWordsLearned += progress.learned || 0;
      totalWordsRemembered += progress.remembered || 0;
      totalWordsToReview += progress.review || 0;
    });

    const decks = progressList.map(p => {
      const progressDoc = p as any;
      return {
        _id: p._id,
        deckId: p.deckId,
        learned: p.learned,
        remembered: p.remembered,
        review: p.review,
        wordStatus: p.wordStatus,
        createdAt: progressDoc.createdAt,
        updatedAt: progressDoc.updatedAt,
      };
    });

    return {
      totalDecks,
      totalWordsLearned,
      totalWordsRemembered,
      totalWordsToReview,
      decks,
    };
  }
}

