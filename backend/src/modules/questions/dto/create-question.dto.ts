import { IsString, IsNotEmpty, IsEnum, IsNumber, IsArray, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../schema/question.schema';
import type { QuestionOption, CorrectAnswer, Explanation } from '../schema/question.schema';

export class CreateQuestionDto {
  @ApiProperty({ 
    description: 'ID of the question group',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  questionGroupId: string;

  @ApiProperty({ 
    description: 'Question number (1-40 for IELTS)',
    example: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  questionNumber: number;

  @ApiProperty({ 
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
    required: true
  })
  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @ApiProperty({ 
    description: 'Question text (can contain HTML)',
    example: 'What is the main idea of the passage?',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ 
    description: 'Options for multiple choice questions',
    example: [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' }
    ],
    required: false
  })
  @IsArray()
  @IsOptional()
  options?: QuestionOption[];

  @ApiProperty({ 
    description: 'Correct answer with alternatives',
    example: {
      value: ['A'],
      alternatives: []
    },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  correctAnswer: CorrectAnswer;

  @ApiProperty({ 
    description: 'Explanation for the answer',
    example: {
      explanationHtml: '<p>The answer is A because...</p>',
      keywords: ['main idea', 'paragraph 1'],
      relatedPassageLocation: 'paragraph 1, lines 5-8'
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  explanation?: Explanation;

  @ApiProperty({ 
    description: 'Points for the question',
    example: 1,
    required: false
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiProperty({ 
    description: 'Order of the question',
    example: 1,
    required: true
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  order: number;
}

