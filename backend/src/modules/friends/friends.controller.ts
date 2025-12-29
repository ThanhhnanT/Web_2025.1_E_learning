import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // Specific routes must come before parameterized routes
  // Requests routes
  @Post('requests')
  async sendFriendRequest(@Body() createDto: CreateFriendRequestDto, @Request() req) {
    return this.friendsService.sendFriendRequest(createDto, req.user._id);
  }

  @Get('requests/sent')
  async getSentFriendRequests(@Request() req) {
    return this.friendsService.getFriendRequests(req.user._id, 'sent');
  }

  @Get('requests')
  async getFriendRequests(@Request() req) {
    // Default to received requests, can add query param later
    return this.friendsService.getFriendRequests(req.user._id, 'received');
  }

  @Patch('requests/:id')
  async updateFriendRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateFriendRequestDto,
    @Request() req,
  ) {
    return this.friendsService.updateFriendRequest(id, updateDto, req.user._id);
  }

  @Delete('requests/:id')
  async cancelFriendRequest(@Param('id') id: string, @Request() req) {
    return this.friendsService.cancelFriendRequest(id, req.user._id);
  }

  // Status route (must come before :friendId and :userId routes)
  @Get('status/:userId')
  async checkFriendshipStatus(@Param('userId') userId: string, @Request() req) {
    // Ensure we get the user ID as string
    const currentUserId = req.user?._id?.toString() || req.user?.userId?.toString() || req.user?._id;
    return this.friendsService.checkFriendshipStatus(currentUserId, userId);
  }

  // Get friends of a specific user (public endpoint)
  @Get('user/:userId')
  async getUserFriends(@Param('userId') userId: string) {
    return this.friendsService.getFriends(userId);
  }

  // General routes (must come last)
  @Get()
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user._id);
  }

  @Delete(':friendId')
  async removeFriend(@Param('friendId') friendId: string, @Request() req) {
    return this.friendsService.removeFriend(friendId, req.user._id);
  }
}

