import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ 
    description: 'Ngày đã hoàn thành',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  completedDay?: number;

  @ApiProperty({ 
    description: 'Ngày hiện tại đang học',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currentDay?: number;

  @ApiProperty({ 
    description: 'Phần trăm hoàn thành (0-100)',
    example: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;
}

