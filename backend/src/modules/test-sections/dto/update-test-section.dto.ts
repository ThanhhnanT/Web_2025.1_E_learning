import { PartialType } from '@nestjs/swagger';
import { CreateTestSectionDto } from './create-test-section.dto';

export class UpdateTestSectionDto extends PartialType(CreateTestSectionDto) {}

