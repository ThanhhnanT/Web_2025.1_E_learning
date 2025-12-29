import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Nội dung đã được cập nhật',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'URL ảnh',
    example: 'https://res.cloudinary.com/...',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Trạng thái bài viết',
    example: 'active',
    enum: ['active', 'pending', 'reported', 'archived'],
    required: false,
  })
  status?: string;
}

