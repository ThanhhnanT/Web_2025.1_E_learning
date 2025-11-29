import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TestType } from '../schema/test.schema';

export class CreateTestDto {
  @ApiProperty({ 
    description: 'Tiêu đề của bài test',
    example: 'IELTS Listening Test 1',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Loại bài test',
    enum: TestType,
    example: TestType.IELTS,
    required: false
  })
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @ApiProperty({ 
    description: 'Ngôn ngữ của bài test',
    enum: ['English', 'Chinese'],
    example: 'English',
    required: true
  })
  @IsEnum(['English', 'Chinese'])
  language: 'English' | 'Chinese';

  @ApiProperty({ 
    description: 'Mức độ của bài test',
    example: 'Intermediate',
    required: true
  })
  @IsString()
  level: string;

  @ApiProperty({ 
    description: 'Thời gian làm bài (phút)',
    example: 60,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ 
    description: 'Tổng số câu hỏi',
    example: 40,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({ 
    description: 'Mô tả về bài test',
    example: 'Bài test luyện thi IELTS Listening với 40 câu hỏi',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'ID của người tạo bài test',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  // New fields for restructured database
  @ApiProperty({ 
    description: 'External slug for crawler integration',
    example: 'cambridge-ielts-020-listening-test-01',
    required: false
  })
  @IsOptional()
  @IsString()
  externalSlug?: string;

  @ApiProperty({ 
    description: 'Series name',
    example: 'Cambridge IELTS 20',
    required: false
  })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiProperty({ 
    description: 'Test number',
    example: 'Test 1',
    required: false
  })
  @IsOptional()
  @IsString()
  testNumber?: string;

  @ApiProperty({ 
    description: 'Skill type',
    example: 'listening',
    required: false
  })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiProperty({ 
    description: 'Source URL',
    example: 'https://ieltstrainingonline.com/...',
    required: false
  })
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}
