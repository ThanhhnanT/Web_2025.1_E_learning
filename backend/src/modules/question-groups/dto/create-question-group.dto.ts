import { IsString, IsNotEmpty, IsEnum, IsNumber, IsArray, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '../schema/question-group.schema';
import type { SharedContent } from '../schema/question-group.schema';

export class CreateQuestionGroupDto {
  @ApiProperty({ 
    description: 'ID of the section',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ 
    description: 'Type of question group',
    enum: GroupType,
    example: GroupType.SHARED_PASSAGE,
    required: true
  })
  @IsEnum(GroupType)
  @IsNotEmpty()
  groupType: GroupType;

  @ApiProperty({ 
    description: 'Title of the question group',
    example: 'Questions 1-5',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: 'Instructions for the question group',
    example: 'Complete the notes below',
    required: false
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ 
    description: 'Question range [start, end]',
    example: [1, 5],
    required: true
  })
  @IsArray()
  @IsNotEmpty()
  questionRange: number[];

  @ApiProperty({ 
    description: 'Shared content (passage, diagram, options, etc.)',
    example: {
      passage: '<p>Reading passage...</p>',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' }
      ]
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  sharedContent?: SharedContent;

  @ApiProperty({ 
    description: 'Order of the question group',
    example: 1,
    required: true
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  order: number;
}

