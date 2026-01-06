import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsAdminController } from './enrollments-admin.controller';
import { Enrollment, EnrollmentSchema } from './schema/enrollment.schema';
import { Course, CourseSchema } from '../courses/schema/course.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Module as CourseModule, ModuleSchema } from '../courses/schema/module.schema';
import { Lesson, LessonSchema } from '../courses/schema/lesson.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
      {
        name: Course.name,
        schema: CourseSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: CourseModule.name,
        schema: ModuleSchema,
      },
      {
        name: Lesson.name,
        schema: LessonSchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [EnrollmentsController, EnrollmentsAdminController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}

