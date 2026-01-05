import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schema/payment.schema';
import { PaymentMethod } from './schema/payment-method.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { StripeService } from './services/stripe.service';
import { VNPayService } from './services/vnpay.service';
import { MomoService } from './services/momo.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Course } from '../courses/schema/course.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(PaymentMethod.name) private paymentMethodModel: Model<PaymentMethod>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
    private stripeService: StripeService,
    private vnpayService: VNPayService,
    private momoService: MomoService,
    private mailerService: MailerService,
    @Inject(forwardRef(() => 'EnrollmentsService')) private enrollmentsService: any,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const newPayment = await this.paymentModel.create(createPaymentDto);
    return newPayment;
  }

  async findAll(userId?: string, courseId?: string, status?: string) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    return await this.paymentModel
      .find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.paymentModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .exec();
  }

  async findByTransactionId(transactionId: string) {
    return await this.paymentModel
      .findOne({ transactionId })
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .exec();
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return await this.paymentModel
      .findByIdAndUpdate(id, updatePaymentDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.paymentModel.findByIdAndDelete(id).exec();
  }

  /**
   * Create payment intent/session based on gateway
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto, ipAddr: string) {
    try {
      // Get course details
      const course = await this.courseModel.findById(dto.courseId).exec();
      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Get user details
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user already enrolled (check if there's a completed payment)
      const existingPayment = await this.paymentModel.findOne({
        userId,
        courseId: dto.courseId,
        status: 'completed',
      }).exec();

      if (existingPayment) {
        throw new BadRequestException('You are already enrolled in this course');
      }

      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

      let gatewayResponse: any;
      let paymentData: any = {
        userId,
        courseId: dto.courseId,
        amount: course.price,
        paymentGateway: dto.paymentGateway,
        transactionId,
        status: 'pending',
        paymentMethod: this.getPaymentMethodType(dto.paymentGateway),
      };

      // Call appropriate gateway service
      switch (dto.paymentGateway) {
        case 'stripe':
          gatewayResponse = await this.stripeService.createPaymentIntent(
            course.price,
            dto.courseId,
            userId,
            course.title,
            user.email,
            dto.savePaymentMethod,
          );
          paymentData.gatewayPaymentIntent = gatewayResponse.sessionId;
          paymentData.metadata = { stripeSessionId: gatewayResponse.sessionId };
          break;

        case 'vnpay':
          const vnpayUrl = this.vnpayService.createPaymentUrl(
            course.price,
            transactionId,
            `Payment for course: ${course.title}`,
            ipAddr,
            dto.returnUrl,
          );
          gatewayResponse = { paymentUrl: vnpayUrl };
          paymentData.metadata = { vnpayOrderId: transactionId };
          break;

        case 'momo':
          gatewayResponse = await this.momoService.createPayment(
            course.price,
            transactionId,
            `Payment for course: ${course.title}`,
            JSON.stringify({ courseId: dto.courseId, userId }),
          );
          if (gatewayResponse.success) {
            paymentData.gatewayPaymentIntent = gatewayResponse.requestId;
            paymentData.metadata = { 
              momoRequestId: gatewayResponse.requestId,
              momoOrderId: gatewayResponse.orderId,
            };
          } else {
            throw new BadRequestException(`Momo payment creation failed: ${gatewayResponse.message}`);
          }
          break;

        default:
          throw new BadRequestException('Invalid payment gateway');
      }

      // Save payment record
      const payment = await this.paymentModel.create(paymentData);

      return {
        paymentId: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        gateway: dto.paymentGateway,
        ...gatewayResponse,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Complete payment and trigger enrollment
   */
  async completePayment(paymentId: string, gatewayTransactionId?: string) {
    try {
      const payment = await this.paymentModel
        .findById(paymentId)
        .populate('userId')
        .populate('courseId')
        .exec();

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status === 'completed') {
        this.logger.warn(`Payment ${paymentId} already completed`);
        return payment;
      }

      // Update payment status
      payment.status = 'completed';
      payment.paymentDate = new Date();
      if (gatewayTransactionId) {
        payment.gatewayTransactionId = gatewayTransactionId;
      }

      await payment.save();

      this.logger.log(`Payment ${paymentId} completed successfully`);

      // Create enrollment
      if (this.enrollmentsService && this.enrollmentsService.createEnrollment) {
        try {
          await this.enrollmentsService.createEnrollment(
            payment.userId,
            payment.courseId,
            payment._id,
          );
          this.logger.log(`Enrollment created for payment ${paymentId}`);
        } catch (enrollmentError) {
          this.logger.error('Error creating enrollment:', enrollmentError);
          // Don't fail the payment completion if enrollment fails
        }
      }

      // Send payment success email
      const user: any = payment.userId;
      const course: any = payment.courseId;
      if (user && course) {
        await this.sendPaymentSuccessEmail(
          user.email,
          user.name,
          course.title,
          payment.amount,
        );
      }

      return payment;
    } catch (error) {
      this.logger.error('Error completing payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(paymentId: string, reason: string) {
    try {
      const payment = await this.paymentModel.findById(paymentId).exec();
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      payment.status = 'failed';
      payment.metadata = { ...payment.metadata, failureReason: reason };
      await payment.save();

      this.logger.log(`Payment ${paymentId} marked as failed: ${reason}`);

      // Send failure notification email
      const user: any = await this.userModel.findById(payment.userId).exec();
      const course: any = await this.courseModel.findById(payment.courseId).exec();
      
      if (user && course) {
        await this.sendPaymentFailedEmail(user.email, user.name, course.title, reason);
      }

      return payment;
    } catch (error) {
      this.logger.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refundPayment(paymentId: string, reason: string) {
    try {
      const payment = await this.paymentModel.findById(paymentId).exec();
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new BadRequestException('Only completed payments can be refunded');
      }

      // Call appropriate gateway refund service
      let refundResult: any;
      switch (payment.paymentGateway) {
        case 'stripe':
          if (payment.gatewayPaymentIntent) {
            refundResult = await this.stripeService.refund(payment.gatewayPaymentIntent);
          }
          break;

        case 'momo':
          if (payment.gatewayTransactionId && payment.metadata?.momoRequestId) {
            refundResult = await this.momoService.refund(
              payment.transactionId,
              payment.metadata.momoRequestId,
              payment.amount,
              parseInt(payment.gatewayTransactionId),
              reason,
            );
          }
          break;

        case 'vnpay':
          // VNPay refund typically requires manual process or separate API
          this.logger.warn('VNPay refund requires manual processing');
          break;
      }

      // Update payment status
      payment.status = 'refunded';
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      await payment.save();

      this.logger.log(`Payment ${paymentId} refunded successfully`);

      return payment;
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getUserPaymentMethods(userId: string) {
    return await this.paymentMethodModel
      .find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(userId: string, gateway: string, methodData: any) {
    try {
      const paymentMethod = await this.paymentMethodModel.create({
        userId,
        gateway,
        methodType: methodData.type || 'card',
        gatewayMethodId: methodData.id,
        last4: methodData.last4,
        brand: methodData.brand,
        expiryMonth: methodData.expMonth,
        expiryYear: methodData.expYear,
        isDefault: false,
      });

      return paymentMethod;
    } catch (error) {
      this.logger.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: string, methodId: string) {
    const result = await this.paymentMethodModel
      .findOneAndDelete({ _id: methodId, userId })
      .exec();

    if (!result) {
      throw new NotFoundException('Payment method not found');
    }

    return { message: 'Payment method removed successfully' };
  }

  /**
   * Send payment success email
   */
  private async sendPaymentSuccessEmail(
    email: string,
    userName: string,
    courseName: string,
    amount: number,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Payment Successful - Course Enrollment Confirmed',
        template: 'payment-success',
        context: {
          userName,
          courseName,
          amount,
        },
      });
    } catch (error) {
      this.logger.error('Error sending payment success email:', error);
    }
  }

  /**
   * Send payment failed email
   */
  private async sendPaymentFailedEmail(
    email: string,
    userName: string,
    courseName: string,
    reason: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Payment Failed - Please Try Again',
        template: 'payment-failed',
        context: {
          userName,
          courseName,
          reason,
        },
      });
    } catch (error) {
      this.logger.error('Error sending payment failed email:', error);
    }
  }

  /**
   * Helper method to map gateway to payment method type
   */
  private getPaymentMethodType(gateway: string): string {
    switch (gateway) {
      case 'stripe':
        return 'credit_card';
      case 'vnpay':
        return 'bank_transfer';
      case 'momo':
        return 'e_wallet';
      default:
        return 'credit_card';
    }
  }
}

