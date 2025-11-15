import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContentDto {
  @ApiProperty({ 
    description: 'ID của bài test',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({ 
    description: 'Nội dung câu hỏi bài nghe (cấu trúc linh động)',
    example: {
      sections: [
        [
          {
            type: 'question',
            form: 'shared',
            title: ['Complete the notes below.'],
            'question-range': [1, 10],
            'answer-type': 'fill',
            content: []
          }
        ]
      ]
    },
    required: true
  })
  @IsObject()
  @IsNotEmpty()
  questionContent: any;
}
