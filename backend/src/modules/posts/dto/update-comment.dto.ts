import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Nội dung đã được cập nhật',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

