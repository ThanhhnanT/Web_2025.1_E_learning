import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ 
    description: 'ID của khóa học',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  courseId: string;

  @ApiProperty({ 
    description: 'Tiêu đề của module',
    example: 'Module 1: Listening Basics',
    required: true
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Mô tả về module',
    example: 'Học các kỹ năng cơ bản về Listening',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Thứ tự của module trong khóa học',
    example: 1,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  order: number;
}

