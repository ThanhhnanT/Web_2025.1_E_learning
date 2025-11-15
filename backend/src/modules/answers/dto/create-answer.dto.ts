import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ 
    description: 'ID của content',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({ 
    description: 'Đáp án đúng (có thể là string, array, object...)',
    example: {
      content: [
        { question: 1, answer: ['litter'] },
        { question: 2, answer: ['dogs'] },
        { question: 3, answer: ['insects'] }
      ]
    },
    required: true
  })
  @IsNotEmpty()
  correctAnswer: any;
}
