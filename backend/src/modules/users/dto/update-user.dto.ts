import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'My bio description', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'viewer', enum: ['administrator', 'editor', 'viewer', 'support'], required: false })
  @IsOptional()
  @IsEnum(['administrator', 'editor', 'viewer', 'support'])
  role?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;
}
