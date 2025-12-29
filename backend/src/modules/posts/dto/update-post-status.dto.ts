import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostStatusDto {
  @ApiProperty({
    description: 'Trạng thái bài viết',
    example: 'active',
    enum: ['active', 'pending', 'reported', 'archived'],
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['active', 'pending', 'reported', 'archived'])
  status: string;
}

