import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionGroupsService } from './question-groups.service';
import { QuestionGroupsController } from './question-groups.controller';
import { QuestionGroup, QuestionGroupSchema } from './schema/question-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionGroup.name, schema: QuestionGroupSchema },
    ]),
  ],
  controllers: [QuestionGroupsController],
  providers: [QuestionGroupsService],
  exports: [QuestionGroupsService],
})
export class QuestionGroupsModule {}

