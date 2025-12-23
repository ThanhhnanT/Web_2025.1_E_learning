import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionsDto {
  @ApiProperty({ type: [String], required: true, example: ['user:view', 'user:edit'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}


