import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyFaceDto {
  @ApiProperty({
    description: 'Base64 encoded image string (with or without data URL prefix)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  image_base64: string;
}

