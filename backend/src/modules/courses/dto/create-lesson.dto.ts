import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ 
    description: 'ID của module',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  moduleId: string;

  @ApiProperty({ 
    description: 'Tiêu đề của lesson',
    example: 'Lesson 1: Introduction to Listening',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Mô tả về lesson',
    example: 'Giới thiệu về kỹ năng nghe',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Thứ tự của lesson trong module',
    example: 1,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ 
    description: 'Loại lesson',
    enum: ['video', 'text', 'quiz'],
    example: 'video',
    required: true
  })
  @IsEnum(['video', 'text', 'quiz'])
  type: 'video' | 'text' | 'quiz';

  @ApiProperty({ 
    description: 'Nội dung của lesson (có thể là video_url, text_content, hoặc quiz_data)',
    example: { video_url: 'https://example.com/video.mp4' },
    required: true
  })
  content: any;

  @ApiProperty({ 
    description: 'Thời gian của lesson (phút)',
    example: 30,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

