import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiLearningPathsService } from './ai-learning-paths.service';
import { AiLearningPathsController } from './ai-learning-paths.controller';
import { AiLearningPathsAdminController } from './ai-learning-paths-admin.controller';
import { LearningPath, LearningPathSchema } from './schema/learning-path.schema';
import { RoadMap, RoadMapSchema } from './schema/roadmap.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningPath.name, schema: LearningPathSchema },
      { name: RoadMap.name, schema: RoadMapSchema },
    ]),
    UsersModule,
  ],
  controllers: [AiLearningPathsController, AiLearningPathsAdminController],
  providers: [AiLearningPathsService],
  exports: [AiLearningPathsService],
})
export class AiLearningPathsModule {}

