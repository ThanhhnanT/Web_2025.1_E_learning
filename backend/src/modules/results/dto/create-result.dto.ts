import { IsString, IsNotEmpty, IsNumber, IsDate, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionAnswer, ReviewNote, SectionScore } from '../schema/result.schema';

export class CreateResultDto {
  @ApiProperty({ 
    description: 'ID của user làm bài test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    description: 'ID của bài test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  // DEPRECATED: Keep for backward compatibility
  @ApiProperty({ 
    description: 'ID của đáp án đúng (deprecated)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  answerId?: string;

  // DEPRECATED: Keep for backward compatibility
  @ApiProperty({ 
    description: 'Câu trả lời của user (deprecated, use answers instead)',
    example: ['litter', 'dogs', 'insects'],
    required: false
  })
  @IsOptional()
  userAnswer?: any;

  // NEW: Detailed answer tracking
  @ApiProperty({ 
    description: 'Detailed answers for each question',
    example: [
      {
        questionId: '507f1f77bcf86cd799439011',
        questionNumber: 1,
        userAnswer: ['fish'],
        isCorrect: true,
        timeSpent: 30
      }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  answers?: QuestionAnswer[];

  @ApiProperty({ 
    description: 'Điểm số đạt được',
    example: 8.5,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Điểm band IELTS tổng (0–9, có .5)',
    example: 7.5,
    minimum: 0,
    maximum: 9,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  bandScore?: number;

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
    description: 'Số câu trả lời đúng',
    example: 32,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  correctAnswers: number;

  @ApiProperty({ 
    description: 'Thời gian làm bài (phút)',
    example: 45,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  timeSpent: number;

  @ApiProperty({ 
    description: 'Thời gian hoàn thành bài test',
    example: '2024-01-15T10:30:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;

  // NEW: Review notes
  @ApiProperty({ 
    description: 'Review notes for wrong answers',
    example: [
      {
        questionId: '507f1f77bcf86cd799439011',
        note: 'Need to review this topic',
        createdAt: '2024-01-15T10:30:00.000Z'
      }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  reviewNotes?: ReviewNote[];

  @ApiProperty({
    description: 'Thống kê điểm theo từng section/skill',
    example: [
      {
        sectionId: '507f1f77bcf86cd799439011',
        sectionType: 'listening',
        correctAnswers: 32,
        totalQuestions: 40,
        bandScore: 7.5,
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  sectionScores?: SectionScore[];
}
