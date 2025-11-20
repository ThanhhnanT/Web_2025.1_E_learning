import { IsString, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashcardDto {
  @ApiProperty({ 
    description: 'Mặt trước của thẻ flashcard',
    example: 'Hello',
    required: true
  })
  @IsString()
  front: string;

  @ApiProperty({ 
    description: 'Mặt sau của thẻ flashcard',
    example: 'Xin chào',
    required: true
  })
  @IsString()
  back: string;

  @ApiProperty({ 
    description: 'ID của khóa học (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ 
    description: 'ID của lesson (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ 
    description: 'ID của người tạo flashcard',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Tên bộ thẻ (deck name)',
    example: 'IELTS Vocabulary',
    required: false
  })
  @IsOptional()
  @IsString()
  deckName?: string;

  @ApiProperty({ 
    description: 'Các tag của flashcard',
    example: ['vocabulary', 'IELTS'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ 
    description: 'Độ khó của flashcard',
    enum: ['easy', 'medium', 'hard'],
    example: 'medium',
    required: false
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

