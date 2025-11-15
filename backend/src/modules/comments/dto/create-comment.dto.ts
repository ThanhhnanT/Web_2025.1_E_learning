import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'ID của bài test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

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
}
