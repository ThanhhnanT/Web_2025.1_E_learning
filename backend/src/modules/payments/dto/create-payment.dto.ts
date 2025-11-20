import { IsString, IsEnum, IsNumber, Min, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ 
    description: 'ID của người dùng',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'ID của khóa học',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  courseId: string;

  @ApiProperty({ 
    description: 'Số tiền thanh toán',
    example: 500000,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Phương thức thanh toán',
    enum: ['credit_card', 'bank_transfer', 'e_wallet'],
    example: 'credit_card',
    required: true
  })
  @IsEnum(['credit_card', 'bank_transfer', 'e_wallet'])
  paymentMethod: 'credit_card' | 'bank_transfer' | 'e_wallet';

  @ApiProperty({ 
    description: 'Trạng thái thanh toán',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    example: 'pending',
    required: false
  })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed', 'refunded'])
  status?: 'pending' | 'completed' | 'failed' | 'refunded';

  @ApiProperty({ 
    description: 'ID giao dịch (unique)',
    example: 'TXN123456789',
    required: true
  })
  @IsString()
  transactionId: string;

  @ApiProperty({ 
    description: 'Ngày thanh toán',
    example: '2024-01-15T10:30:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

