import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeckDto {
  @ApiProperty({ 
    description: 'Tên bộ thẻ',
    example: 'IELTS Vocabulary',
    required: true
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Mô tả bộ thẻ',
    example: 'Bộ từ vựng IELTS cơ bản',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'ID của người tạo deck',
    example: '691879f5d21585549f68a439',
    required: true
  })
  @IsString()
  createdBy: string;
}

