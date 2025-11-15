import { IsString, IsNotEmpty, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ 
    description: 'ID của đáp án đúng',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  answerId: string;

  @ApiProperty({ 
    description: 'Câu trả lời của user (có thể là string, array, object...)',
    example: ['litter', 'dogs', 'insects'],
    required: true
  })
  @IsNotEmpty()
  userAnswer: any;

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
}
