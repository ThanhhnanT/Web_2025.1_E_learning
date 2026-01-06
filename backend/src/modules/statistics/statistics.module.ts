import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsAdminController } from './statistics-admin.controller';
import { Result, ResultSchema } from '../results/schema/result.schema';
import { Payment, PaymentSchema } from '../payments/schema/payment.schema';
import { FlashcardProgress, FlashcardProgressSchema } from '../flashcards/schema/flashcard-progress.schema';
import { Course, CourseSchema } from '../courses/schema/course.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Post, PostSchema } from '../posts/schema/post.schema';
import { PostComment, PostCommentSchema } from '../posts/schema/comment.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/schema/enrollment.schema';
import { Test, TestSchema } from '../tests/schema/test.schema';
import { FlashcardDeck, FlashcardDeckSchema } from '../flashcards/schema/flashcard-deck.schema';
import { Flashcard, FlashcardSchema } from '../flashcards/schema/flashcard.schema';
import { FriendsModule } from '../friends/friends.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: FlashcardProgress.name, schema: FlashcardProgressSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: PostComment.name, schema: PostCommentSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Test.name, schema: TestSchema },
      { name: FlashcardDeck.name, schema: FlashcardDeckSchema },
      { name: Flashcard.name, schema: FlashcardSchema },
    ]),
    FriendsModule,
    UsersModule,
  ],
  controllers: [StatisticsController, StatisticsAdminController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}

