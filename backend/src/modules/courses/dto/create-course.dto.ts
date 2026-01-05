import { IsString, IsEnum, IsNumber, IsOptional, Min, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ 
    description: 'Tiêu đề của khóa học',
    example: 'IELTS Complete Course',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Mô tả về khóa học',
    example: 'Khóa học IELTS toàn diện từ cơ bản đến nâng cao',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Ngôn ngữ của khóa học',
    enum: ['English', 'Chinese'],
    example: 'English',
    required: true
  })
  @IsEnum(['English', 'Chinese'])
  language: 'English' | 'Chinese';

  @ApiProperty({ 
    description: 'Mức độ của khóa học',
    example: 'Intermediate',
    required: true
  })
  @IsString()
  level: string;

  @ApiProperty({ 
    description: 'Giá của khóa học',
    example: 500000,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ 
    description: 'URL hình ảnh thumbnail của khóa học',
    example: 'https://example.com/thumbnail.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiProperty({ 
    description: 'URL avatar của khóa học',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ 
    description: 'ID của người hướng dẫn (instructor)',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  instructor: string;

  @ApiProperty({ 
    description: 'Trạng thái của khóa học',
    enum: ['draft', 'published'],
    example: 'draft',
    required: false
  })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiProperty({ 
    description: 'Các tag của khóa học',
    example: ['IELTS', 'English', 'Listening'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ 
    description: 'Danh mục khóa học',
    enum: ['HSK', 'TOEIC', 'IELTS'],
    example: 'IELTS',
    required: false
  })
  @IsOptional()
  @IsEnum(['HSK', 'TOEIC', 'IELTS'])
  category?: 'HSK' | 'TOEIC' | 'IELTS';
}

