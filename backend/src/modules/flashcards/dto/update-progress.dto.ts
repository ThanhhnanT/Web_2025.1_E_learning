import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ 
    description: 'Số từ đã học',
    example: 10,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  learned?: number;

  @ApiProperty({ 
    description: 'Số từ đã nhớ',
    example: 5,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remembered?: number;

  @ApiProperty({ 
    description: 'Số từ cần ôn lại',
    example: 3,
    required: false,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  review?: number;

  @ApiProperty({ 
    description: 'Trạng thái từng từ: { "word": "status" }',
    example: { "hello": "remembered", "world": "review" },
    required: false
  })
  @IsOptional()
  wordStatus?: { [word: string]: string };
}

