import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from './schema/enrollment.schema';
import { Course } from '../courses/schema/course.schema';
import { User } from '../users/schemas/user.schema';
import { Payment } from '../payments/schema/payment.schema';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
    private mailerService: MailerService,
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

    return await this.enrollmentModel
      .find(query)
      .populate('courseId')
      .populate('paymentId')
      .sort({ enrolledAt: -1 })
      .exec();
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

    return enrollment;
  }

  /**
   * Check if user is enrolled in a course
   */
  async checkEnrollment(userId: string | Types.ObjectId, courseId: string | Types.ObjectId) {
    const enrollment = await this.enrollmentModel
      .findOne({ userId, courseId })
      .exec();

    return {
      isEnrolled: !!enrollment,
      enrollment,
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
      await this.mailerService.sendMail({
        to: email,
        subject: 'Course Enrollment Successful',
        template: 'enrollment-success',
        context: {
          userName,
          courseName,
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
      await this.mailerService.sendMail({
        to: email,
        subject: 'Congratulations on Completing the Course!',
        template: 'course-completion',
        context: {
          userName,
          courseName,
        },
      });
    } catch (error) {
      this.logger.error('Error sending completion email:', error);
    }
  }
}

