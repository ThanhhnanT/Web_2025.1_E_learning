import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestDto {
  @ApiProperty({ 
    description: 'Tiêu đề của bài test',
    example: 'IELTS Listening Test 1',
    required: true
  })
  @IsString()
  title: string;

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
}
