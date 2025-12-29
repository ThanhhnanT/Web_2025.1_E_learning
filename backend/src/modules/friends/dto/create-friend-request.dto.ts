import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateFriendRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  receiverId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

