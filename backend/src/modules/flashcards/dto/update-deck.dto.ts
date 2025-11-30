import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeckDto {
  @ApiProperty({ 
    description: 'Tên bộ thẻ',
    example: 'IELTS Vocabulary',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Mô tả bộ thẻ',
    example: 'Bộ từ vựng IELTS cơ bản',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}

