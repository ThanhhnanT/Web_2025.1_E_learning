import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { TestsFullController } from './tests-full.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestSchema } from './schema/test.schema';
import { TestSectionsModule } from '../test-sections/test-sections.module';
import { QuestionGroupsModule } from '../question-groups/question-groups.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Test.name,
        schema: TestSchema,
      },
    ]),
    TestSectionsModule,
    QuestionGroupsModule,
    QuestionsModule,
  ],
  controllers: [TestsController, TestsFullController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
