import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendRequest, FriendRequestSchema } from './schema/friend-request.schema';
import { Friendship, FriendshipSchema } from './schema/friendship.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}

