import { IsEnum, IsOptional } from 'class-validator';
import { FriendRequestStatus } from '../schema/friend-request.schema';

export class UpdateFriendRequestDto {
  @IsOptional()
  @IsEnum(FriendRequestStatus)
  status?: FriendRequestStatus;
}

