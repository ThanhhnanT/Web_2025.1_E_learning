import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schema/course.schema';
import { Module as CourseModule, ModuleSchema as CourseModuleSchema } from './schema/module.schema';
import { Lesson, LessonSchema } from './schema/lesson.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Course.name,
        schema: CourseSchema,
      },
      {
        name: CourseModule.name,
        schema: CourseModuleSchema,
      },
      {
        name: Lesson.name,
        schema: LessonSchema,
      },
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}

