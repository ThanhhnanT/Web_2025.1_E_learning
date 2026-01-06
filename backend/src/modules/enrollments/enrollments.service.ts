import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from './schema/enrollment.schema';
import { Course } from '../courses/schema/course.schema';
import { User } from '../users/schemas/user.schema';
import { Payment } from '../payments/schema/payment.schema';
import { Module as CourseModule } from '../courses/schema/module.schema';
import { Lesson } from '../courses/schema/lesson.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * Create enrollment after successful payment
   */
  async createEnrollment(userId: string | Types.ObjectId, courseId: string | Types.ObjectId, paymentId: string | Types.ObjectId) {
    try {
      // Check if already enrolled
      const existingEnrollment = await this.enrollmentModel.findOne({
        userId,
        courseId,
      }).exec();

      if (existingEnrollment) {
        this.logger.warn(`User ${userId} already enrolled in course ${courseId}`);
        return existingEnrollment;
      }

      // Create enrollment
      const enrollment = await this.enrollmentModel.create({
        userId,
        courseId,
        paymentId,
        enrolledAt: new Date(),
        progress: 0,
        status: 'active',
      });

      // Update course totalStudents count
      await this.courseModel.findByIdAndUpdate(
        courseId,
        { $inc: { totalStudents: 1 } },
      ).exec();

      // Send enrollment confirmation email
      const user: any = await this.userModel.findById(userId).exec();
      const course: any = await this.courseModel.findById(courseId).exec();

      if (user && course) {
        await this.sendEnrollmentEmail(user.email, user.name, course.title);
      }

      this.logger.log(`Enrollment created successfully for user ${userId} in course ${courseId}`);

      return enrollment;
    } catch (error) {
      this.logger.error('Error creating enrollment:', error);
      throw error;
    }
  }

  /**
   * Get user's enrollments
   */
  async getEnrollments(userId: string | Types.ObjectId, status?: string) {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const enrollments = await this.enrollmentModel
      .find(query)
      .populate('courseId')
      .populate('paymentId')
      .sort({ enrolledAt: -1 })
      .exec();

    // Auto-fix progress for all enrollments
    for (const enrollment of enrollments) {
      await this.recalculateProgressIfNeeded(enrollment);
    }

    return enrollments;
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string) {
    const enrollment = await this.enrollmentModel
      .findById(enrollmentId)
      .populate('courseId')
      .populate('userId', 'name email')
      .populate('paymentId')
      .exec();

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Auto-fix progress if it doesn't match completedLessons
    await this.recalculateProgressIfNeeded(enrollment);

    return enrollment;
  }

  /**
   * Recalculate and update progress if it doesn't match completedLessons
   */
  private async recalculateProgressIfNeeded(enrollment: any) {
    if (!enrollment.completedLessons || enrollment.completedLessons.length === 0) {
      // No completed lessons, progress should be 0
      if (enrollment.progress !== 0 && enrollment.status !== 'completed') {
        enrollment.progress = 0;
        await enrollment.save();
      }
      return;
    }

    // Calculate actual progress
    const progress = await this.calculateProgress(
      enrollment.courseId.toString(),
      enrollment.completedLessons
    );

    // Update if progress doesn't match
    if (enrollment.progress !== progress.progressPercentage) {
      enrollment.progress = progress.progressPercentage;
      
      // Also update status if needed
      if (progress.progressPercentage >= 100 && enrollment.status !== 'completed') {
        enrollment.status = 'completed';
        if (!enrollment.completedAt) {
          enrollment.completedAt = new Date();
        }
      } else if (progress.progressPercentage < 100 && enrollment.status === 'completed' && enrollment.progress === 0) {
        // Only change status if progress was 0 (likely a bug)
        enrollment.status = 'active';
      }
      
      await enrollment.save();
    }
  }

  /**
   * Check if user is enrolled in a course
   */
  async checkEnrollment(userId: string | Types.ObjectId, courseId: string | Types.ObjectId) {
    const enrollment = await this.enrollmentModel
      .findOne({ userId, courseId })
      .exec();

    if (!enrollment) {
      return {
        isEnrolled: false,
        enrollment: null,
        progress: null,
      };
    }

    // Get progress details
    const progress = await this.getEnrollmentProgress(enrollment._id.toString());

    return {
      isEnrolled: true,
      enrollment,
      progress,
    };
  }

  /**
   * Update course progress
   */
  async updateProgress(enrollmentId: string, progress: number) {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.progress = progress;

    // Mark as completed if progress reaches 100%
    if (progress === 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();

      // Send completion email
      const user: any = await this.userModel.findById(enrollment.userId).exec();
      const course: any = await this.courseModel.findById(enrollment.courseId).exec();

      if (user && course) {
        await this.sendCompletionEmail(user.email, user.name, course.title);
      }
    }

    await enrollment.save();

    return enrollment;
  }

  /**
   * Mark a lesson as completed
   */
  async markLessonComplete(enrollmentId: string, lessonId: string) {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Add lesson to completedLessons if not already there
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Update last accessed lesson
    enrollment.lastAccessedLessonId = lessonId;

    // Calculate and update progress percentage
    // IMPORTANT: Pass completedLessons to calculateProgress
    const progress = await this.calculateProgress(
      enrollment.courseId.toString(),
      enrollment.completedLessons
    );
    enrollment.progress = progress.progressPercentage;

    // Mark as completed if all lessons are done
    if (progress.completedCount === progress.totalLessons && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();

      // Send completion email
      const user: any = await this.userModel.findById(enrollment.userId).exec();
      const course: any = await this.courseModel.findById(enrollment.courseId).exec();

      if (user && course) {
        await this.sendCompletionEmail(user.email, user.name, course.title);
      }
    }

    await enrollment.save();

    return enrollment;
  }

  /**
   * Get enrollment progress details
   */
  async getEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const progress = await this.calculateProgress(enrollment.courseId.toString(), enrollment.completedLessons);

    return {
      completedLessons: enrollment.completedLessons || [],
      totalLessons: progress.totalLessons,
      completedCount: progress.completedCount,
      progressPercentage: progress.progressPercentage,
      lastAccessedLessonId: enrollment.lastAccessedLessonId,
    };
  }

  /**
   * Calculate progress for a course
   */
  private async calculateProgress(courseId: string, completedLessons: string[] = []) {
    try {
      // Convert courseId to ObjectId if it's a valid ObjectId string
      const courseIdQuery = Types.ObjectId.isValid(courseId) 
        ? new Types.ObjectId(courseId) 
        : courseId;

      // Get all modules for the course
      const modules = await this.moduleModel.find({ courseId: courseIdQuery }).exec();

      if (modules.length === 0) {
        return {
          totalLessons: 0,
          completedCount: completedLessons.length,
          progressPercentage: 0,
        };
      }

      // Get all lessons for all modules
      const moduleIds = modules.map(m => m._id);
      const allLessons = await this.lessonModel
        .find({ 
          moduleId: { $in: moduleIds },
          deletedAt: null 
        })
        .exec();

      const totalLessons = allLessons.length;
      const completedCount = completedLessons.length;
      const progressPercentage = totalLessons > 0 
        ? Math.round((completedCount / totalLessons) * 100) 
        : 0;

      return {
        totalLessons,
        completedCount,
        progressPercentage,
      };
    } catch (error) {
      this.logger.error(`Error calculating progress for course ${courseId}:`, error);
      return {
        totalLessons: 0,
        completedCount: completedLessons.length,
        progressPercentage: 0,
      };
    }
  }

  /**
   * Get all enrollments for a course
   */
  async getCourseEnrollments(courseId: string | Types.ObjectId) {
    return await this.enrollmentModel
      .find({ courseId })
      .populate('userId', 'name email')
      .populate('paymentId')
      .sort({ enrolledAt: -1 })
      .exec();
  }

  /**
   * Suspend enrollment
   */
  async suspendEnrollment(enrollmentId: string, reason?: string) {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.status = 'suspended';
    await enrollment.save();

    this.logger.log(`Enrollment ${enrollmentId} suspended. Reason: ${reason || 'Not specified'}`);

    return enrollment;
  }

  /**
   * Reactivate enrollment
   */
  async reactivateEnrollment(enrollmentId: string) {
    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === 'completed') {
      throw new BadRequestException('Cannot reactivate a completed enrollment');
    }

    enrollment.status = 'active';
    await enrollment.save();

    this.logger.log(`Enrollment ${enrollmentId} reactivated`);

    return enrollment;
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(userId: string | Types.ObjectId) {
    const enrollments = await this.enrollmentModel.find({ userId }).exec();

    const total = enrollments.length;
    const active = enrollments.filter(e => e.status === 'active').length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const suspended = enrollments.filter(e => e.status === 'suspended').length;

    const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
    const averageProgress = total > 0 ? totalProgress / total : 0;

    return {
      total,
      active,
      completed,
      suspended,
      averageProgress: Math.round(averageProgress * 100) / 100,
    };
  }

  /**
   * Send enrollment confirmation email
   */
  private async sendEnrollmentEmail(email: string, userName: string, courseName: string) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      await this.mailerService.sendMail({
        to: email,
        subject: 'Course Enrollment Successful',
        template: 'enrollment-success',
        context: {
          userName,
          courseName,
          frontendUrl,
        },
      });
    } catch (error) {
      this.logger.error('Error sending enrollment email:', error);
    }
  }

  /**
   * Send course completion email
   */
  private async sendCompletionEmail(email: string, userName: string, courseName: string) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      await this.mailerService.sendMail({
        to: email,
        subject: 'Congratulations on Completing the Course!',
        template: 'course-completion',
        context: {
          userName,
          courseName,
          frontendUrl,
        },
      });
      this.logger.log(`✅ Course completion email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send completion email to ${email}:`, error);
      if (error instanceof Error) {
        this.logger.error('Error details:', {
          message: error.message,
          code: (error as any).code,
          command: (error as any).command,
          response: (error as any).response,
        });
      }
    }
  }
}

