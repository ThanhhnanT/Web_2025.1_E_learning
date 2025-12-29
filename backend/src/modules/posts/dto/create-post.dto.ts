import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Đây là nội dung bài viết của tôi',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'URL ảnh (sẽ được upload lên Cloudinary)',
    example: 'https://res.cloudinary.com/...',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

