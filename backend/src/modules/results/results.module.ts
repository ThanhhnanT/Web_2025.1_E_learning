import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from './schema/result.schema';
import { Test, TestSchema } from '../tests/schema/test.schema';
import { TestSection, TestSectionSchema } from '../test-sections/schema/test-section.schema';
import { Question, QuestionSchema } from '../questions/schema/question.schema';
import { ScoringService } from './scoring.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Result.name,
        schema: ResultSchema,
      },
      {
        name: Test.name,
        schema: TestSchema,
      },
      {
        name: TestSection.name,
        schema: TestSectionSchema,
      },
      {
        name: Question.name,
        schema: QuestionSchema,
      },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService, ScoringService],
  exports: [ResultsService, ScoringService],
})
export class ResultsModule {}
