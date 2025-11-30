import { IsString, IsNotEmpty, IsEnum, IsNumber, IsArray, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SectionType } from '../schema/test-section.schema';
import type { SectionResources } from '../schema/test-section.schema';

export class CreateTestSectionDto {
  @ApiProperty({ 
    description: 'ID of the test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({ 
    description: 'Type of section',
    enum: SectionType,
    example: SectionType.LISTENING,
    required: true
  })
  @IsEnum(SectionType)
  @IsNotEmpty()
  sectionType: SectionType;

  @ApiProperty({ 
    description: 'Part number (1, 2, 3, 4 for IELTS)',
    example: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  partNumber: number;

  @ApiProperty({ 
    description: 'Title of the section',
    example: 'Part 1',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: 'Question range [start, end]',
    example: [1, 10],
    required: true
  })
  @IsArray()
  @IsNotEmpty()
  questionRange: number[];

  @ApiProperty({ 
    description: 'Section resources (audio, passage, transcript, etc.)',
    example: {
      audio: 'https://example.com/audio.mp3',
      transcriptHtml: '<p>Transcript...</p>',
      instructions: 'Complete the notes below'
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  resources?: SectionResources;

  @ApiProperty({ 
    description: 'Order of the section',
    example: 1,
    required: true
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  order: number;
}

