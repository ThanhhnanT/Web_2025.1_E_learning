import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { PaymentMethod, PaymentMethodSchema } from './schema/payment-method.schema';
import { Course, CourseSchema } from '../courses/schema/course.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StripeService } from './services/stripe.service';
import { VNPayService } from './services/vnpay.service';
import { MomoService } from './services/momo.service';
import { ConfigModule } from '@nestjs/config';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';

@Module({
  imports: [
    ConfigModule,
    EnrollmentsModule,
    FaceRecognitionModule,
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: PaymentMethod.name,
        schema: PaymentMethodSchema,
      },
      {
        name: Course.name,
        schema: CourseSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, VNPayService, MomoService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

