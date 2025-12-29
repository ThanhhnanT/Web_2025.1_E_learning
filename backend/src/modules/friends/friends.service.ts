import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequest, FriendRequestStatus } from './schema/friend-request.schema';
import { Friendship } from './schema/friendship.schema';
import { User } from '../users/schemas/user.schema';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequest>,
    @InjectModel(Friendship.name)
    private friendshipModel: Model<Friendship>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async sendFriendRequest(createDto: CreateFriendRequestDto, senderId: string) {
    const { receiverId, note } = createDto;

    // Check if sender and receiver are the same
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if friendship already exists (check in user.friends array)
    const sender = await this.userModel.findById(senderId).select('friends').lean();
    const receiver = await this.userModel.findById(receiverId).select('friends').lean();
    
    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    const senderFriends = (sender.friends || []).map(id => id.toString());
    const receiverFriends = (receiver.friends || []).map(id => id.toString());

    if (senderFriends.includes(receiverId) || receiverFriends.includes(senderId)) {
      throw new BadRequestException('Friendship already exists');
    }

    // Check if there's a pending request
    const existingRequest = await this.friendRequestModel.findOne({
      $or: [
        {
          senderId: new Types.ObjectId(senderId),
          receiverId: new Types.ObjectId(receiverId),
          status: FriendRequestStatus.PENDING,
        },
        {
          senderId: new Types.ObjectId(receiverId),
          receiverId: new Types.ObjectId(senderId),
          status: FriendRequestStatus.PENDING,
        },
      ],
      deletedAt: null,
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const friendRequest = await this.friendRequestModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      note,
      status: FriendRequestStatus.PENDING,
    });

    return this.friendRequestModel
      .findById(friendRequest._id)
      .populate('senderId', 'name email avatar_url')
      .populate('receiverId', 'name email avatar_url')
      .lean();
  }

  async getFriendRequests(userId: string, type: 'sent' | 'received' = 'received') {
    const query =
      type === 'sent'
        ? { senderId: new Types.ObjectId(userId) }
        : { receiverId: new Types.ObjectId(userId) };

    const requests = await this.friendRequestModel
      .find({
        ...query,
        status: FriendRequestStatus.PENDING,
        deletedAt: null,
      })
      .populate('senderId', 'name email avatar_url')
      .populate('receiverId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .lean();

    return requests;
  }

  async updateFriendRequest(
    requestId: string,
    updateDto: UpdateFriendRequestDto,
    userId: string,
  ) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request || request.deletedAt) {
      throw new NotFoundException('Friend request not found');
    }

    // Normalize IDs to strings for comparison
    const receiverIdStr = request.receiverId?.toString() || request.receiverId;
    const userIdStr = userId?.toString() || userId;

    console.log('updateFriendRequest - Debug:', {
      requestId,
      receiverId: receiverIdStr,
      userId: userIdStr,
      match: receiverIdStr === userIdStr,
    });

    // Only receiver can accept/reject
    if (receiverIdStr !== userIdStr) {
      throw new ForbiddenException('Only receiver can update this request');
    }

    if (updateDto.status === FriendRequestStatus.ACCEPTED) {
      // Add friends to both users' friends array
      const senderId = new Types.ObjectId(request.senderId.toString());
      const receiverId = new Types.ObjectId(request.receiverId.toString());

      // Add receiver to sender's friends list
      await this.userModel.findByIdAndUpdate(
        senderId,
        { $addToSet: { friends: receiverId } },
        { new: true }
      );

      // Add sender to receiver's friends list
      await this.userModel.findByIdAndUpdate(
        receiverId,
        { $addToSet: { friends: senderId } },
        { new: true }
      );

      // Update request status
      request.status = FriendRequestStatus.ACCEPTED;
      await request.save();
    } else if (updateDto.status === FriendRequestStatus.REJECTED) {
      request.status = FriendRequestStatus.REJECTED;
      await request.save();
    }

    return this.friendRequestModel
      .findById(requestId)
      .populate('senderId', 'name email avatar_url')
      .populate('receiverId', 'name email avatar_url')
      .lean();
  }

  async cancelFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request || request.deletedAt) {
      throw new NotFoundException('Friend request not found');
    }

    // Only sender can cancel
    if (request.senderId.toString() !== userId) {
      throw new ForbiddenException('Only sender can cancel this request');
    }

    request.status = FriendRequestStatus.CANCELLED;
    await request.save();

    return this.friendRequestModel
      .findById(requestId)
      .populate('senderId', 'name email avatar_url')
      .populate('receiverId', 'name email avatar_url')
      .lean();
  }

  async getFriends(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('friends', 'name email avatar_url createdAt')
      .lean();

    if (!user || !user.friends) {
      return [];
    }

    // Map to return friend info
    return (user.friends as any[]).map((friend: any) => ({
      _id: friend._id,
      name: friend.name,
      email: friend.email,
      avatar_url: friend.avatar_url,
      friendsSince: friend.createdAt || new Date(), // Use createdAt as friendsSince
    }));
  }

  async removeFriend(friendId: string, userId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const friendIdObj = new Types.ObjectId(friendId);

    // Check if friendship exists
    const user = await this.userModel.findById(userIdObj).select('friends').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userFriends = (user.friends || []).map(id => id.toString());
    if (!userFriends.includes(friendId)) {
      throw new NotFoundException('Friendship not found');
    }

    // Remove friend from user's friends list
    await this.userModel.findByIdAndUpdate(
      userIdObj,
      { $pull: { friends: friendIdObj } },
      { new: true }
    );

    // Remove user from friend's friends list
    await this.userModel.findByIdAndUpdate(
      friendIdObj,
      { $pull: { friends: userIdObj } },
      { new: true }
    );

    return { message: 'Friend removed successfully' };
  }

  async checkFriendshipStatus(userId1: string, userId2: string) {
    // Normalize userIds to strings for comparison
    const userId1Str = userId1?.toString() || userId1;
    const userId2Str = userId2?.toString() || userId2;
    
    // Check if they are friends (check in user.friends array)
    const user1 = await this.userModel.findById(userId1Str).select('friends').lean();
    if (!user1) {
      return { status: 'none' };
    }

    const user1Friends = (user1.friends || []).map(id => id.toString());
    if (user1Friends.includes(userId2Str)) {
      return { status: 'friends' };
    }

    // Check for pending requests
    const pendingRequest = await this.friendRequestModel.findOne({
      $or: [
        {
          senderId: new Types.ObjectId(userId1Str),
          receiverId: new Types.ObjectId(userId2Str),
          status: FriendRequestStatus.PENDING,
        },
        {
          senderId: new Types.ObjectId(userId2Str),
          receiverId: new Types.ObjectId(userId1Str),
          status: FriendRequestStatus.PENDING,
        },
      ],
      deletedAt: null,
    });

    if (pendingRequest) {
      // Compare ObjectIds properly - ensure both are strings
      const senderIdStr = pendingRequest.senderId?.toString() || pendingRequest.senderId;
      const isSender = senderIdStr === userId1Str;
      
      console.log('checkFriendshipStatus - Debug:', {
        userId1: userId1Str,
        userId2: userId2Str,
        senderId: senderIdStr,
        receiverId: pendingRequest.receiverId?.toString(),
        isSender: isSender,
      });
      
      return {
        status: 'pending',
        isSender: isSender,
        request: pendingRequest,
      };
    }

    return { status: 'none' };
  }
}

