import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'ID của bài test (optional, either testId or courseId must be provided)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  testId?: string;

  @ApiProperty({ 
    description: 'ID của khóa học (optional, either testId or courseId must be provided)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ 
    description: 'ID của user tạo comment',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    description: 'Nội dung comment',
    example: 'Bài test này rất hay và hữu ích!',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    description: 'Đánh giá sao (1-5), khuyến khích khi comment cho course',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
