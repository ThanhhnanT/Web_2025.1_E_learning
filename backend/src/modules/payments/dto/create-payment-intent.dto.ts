import { IsString, IsEnum, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ 
    description: 'ID của khóa học cần thanh toán',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsString()
  courseId: string;

  @ApiProperty({ 
    description: 'Cổng thanh toán',
    enum: ['stripe', 'vnpay', 'momo'],
    example: 'stripe',
    required: true
  })
  @IsEnum(['stripe', 'vnpay', 'momo'])
  paymentGateway: 'stripe' | 'vnpay' | 'momo';

  @ApiProperty({ 
    description: 'Có lưu phương thức thanh toán cho lần sau không',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  savePaymentMethod?: boolean;

  @ApiProperty({ 
    description: 'ID phương thức thanh toán đã lưu (nếu sử dụng)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ 
    description: 'URL trả về sau khi thanh toán thành công',
    example: 'http://localhost:3000/payment/result',
    required: false
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @ApiProperty({ 
    description: 'URL trả về khi hủy thanh toán',
    example: 'http://localhost:3000/payment/canceled',
    required: false
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}

