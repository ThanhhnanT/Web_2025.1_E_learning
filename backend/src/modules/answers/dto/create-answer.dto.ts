import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerKeyDto {
  @ApiProperty({ 
    description: 'Question number',
    example: 1,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  questionNumber: number;

  @ApiProperty({ 
    description: 'Correct answer values',
    example: ['break'],
    required: true
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  correctAnswer: string[];

  @ApiProperty({ 
    description: 'Alternative acceptable answers',
    example: ['break time'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternatives?: string[];
}

export class CreateAnswerDto {
  @ApiProperty({ 
    description: 'ID của test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({ 
    description: 'ID của test section',
    example: '507f1f77bcf86cd799439012',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ 
    description: 'Part number (1, 2, 3, 4)',
    example: 1,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  partNumber: number;

  @ApiProperty({ 
    description: 'HTML transcript from website (keep original structure)',
    example: '<div><p>WOMAN: It\'s really good to see you...</p></div>',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  transcriptHtml: string;

  @ApiProperty({ 
    description: 'List of correct answers by question number',
    example: [
      { questionNumber: 1, correctAnswer: ['break'] },
      { questionNumber: 2, correctAnswer: ['time'] }
    ],
    required: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerKeyDto)
  @IsNotEmpty()
  answerKeys: AnswerKeyDto[];

  @ApiProperty({ 
    description: 'Audio URL for this part',
    example: 'https://ieltstrainingonline.com/wp-content/uploads/2025/07/cam20-test2-part1.MP3',
    required: false
  })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiProperty({ 
    description: 'Source URL where transcript was crawled from',
    example: 'https://ieltstrainingonline.com/audioscripts-cambridge-ielts-020-listening-test-02/',
    required: false
  })
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}
