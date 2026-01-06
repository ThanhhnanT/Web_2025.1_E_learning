import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAiLearningPathDto {
  @ApiProperty({ 
    description: 'Mục tiêu học tập',
    example: 'I want to learn Computer Vision',
    required: true
  })
  @IsString()
  goal: string;

  @ApiProperty({ 
    description: 'Trình độ hiện tại',
    example: 'Beginner',
    required: false
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ 
    description: 'Mô tả về mục tiêu học tập',
    example: 'This is a course to learn Computer Vision step by step',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Số giờ ước tính',
    example: 40,
    required: true
  })
  @IsNumber()
  @Min(1)
  estimatedHours: number;

  @ApiProperty({ 
    description: 'Số giờ học mỗi tuần',
    example: 5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  weeklyHours?: number;

  @ApiProperty({ 
    description: 'Mục tiêu và sở thích học tập bổ sung',
    example: 'I prefer video content and practical exercises',
    required: false
  })
  @IsOptional()
  @IsString()
  goals?: string;
}

