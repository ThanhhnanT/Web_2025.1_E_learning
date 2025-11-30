import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiProperty({ 
    description: 'Từ vựng',
    example: 'absent',
    required: true
  })
  @IsString()
  word: string;

  @ApiProperty({ 
    description: 'Loại từ',
    example: 'adjective',
    required: true
  })
  @IsString()
  type: string;

  @ApiProperty({ 
    description: 'Phiên âm',
    example: 'ˈæbsənt',
    required: true
  })
  @IsString()
  phonetic: string;

  @ApiProperty({ 
    description: 'Định nghĩa',
    example: 'vắng mặt',
    required: true
  })
  @IsString()
  definition: string;

  @ApiProperty({ 
    description: 'Ví dụ',
    example: 'She was absent from the meeting.',
    required: true
  })
  @IsString()
  example: string;

  @ApiProperty({ 
    description: 'URL hình ảnh',
    example: 'https://example.com/image.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ 
    description: 'URL audio',
    example: 'https://example.com/audio.mp3',
    required: false
  })
  @IsOptional()
  @IsString()
  audio?: string;

  @ApiProperty({ 
    description: 'ID của deck',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  deckId: string;

  @ApiProperty({ 
    description: 'ID của người tạo',
    example: '691879f5d21585549f68a439',
    required: true
  })
  @IsString()
  userId: string;

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

