import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReactionDto {
  @ApiProperty({
    description: 'Emoji reaction',
    example: 'like',
    required: true,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  emoji: string;
}

