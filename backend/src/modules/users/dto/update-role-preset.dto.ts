import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class UpdateRolePresetDto {
  @ApiProperty({ 
    type: [String], 
    required: true, 
    example: ['user:view', 'user:edit', 'content:publish'] 
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

