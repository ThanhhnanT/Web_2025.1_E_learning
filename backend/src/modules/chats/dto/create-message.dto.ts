import { IsNotEmpty, IsString, IsMongoId, IsOptional, IsEnum } from 'class-validator';
import { MessageType } from '../schema/message.schema';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  conversationId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

