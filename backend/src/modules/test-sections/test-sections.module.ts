import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestSectionsService } from './test-sections.service';
import { TestSectionsController } from './test-sections.controller';
import { TestSection, TestSectionSchema } from './schema/test-section.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestSection.name, schema: TestSectionSchema },
    ]),
  ],
  controllers: [TestSectionsController],
  providers: [TestSectionsService],
  exports: [TestSectionsService],
})
export class TestSectionsModule {}

