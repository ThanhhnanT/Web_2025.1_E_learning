import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Đây là bình luận của tôi',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID của comment cha (nếu là reply)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  // Allow image field in DTO to prevent validation error when FileInterceptor is used
  // This field is ignored in service, actual file is handled via @UploadedFile()
  @IsOptional()
  image?: any;
}

