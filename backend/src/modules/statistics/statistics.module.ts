import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Result, ResultSchema } from '../results/schema/result.schema';
import { Payment, PaymentSchema } from '../payments/schema/payment.schema';
import { FlashcardProgress, FlashcardProgressSchema } from '../flashcards/schema/flashcard-progress.schema';
import { Course, CourseSchema } from '../courses/schema/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: FlashcardProgress.name, schema: FlashcardProgressSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}

