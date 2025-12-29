import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { ChatsGateway } from './chats.gateway';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly chatsGateway: ChatsGateway,
  ) {}

  @Post('conversations')
  async createOrGetConversation(@Body() createDto: CreateConversationDto, @Request() req) {
    return this.chatsService.createOrGetConversation(createDto, req.user._id);
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatsService.getConversations(req.user._id);
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string, @Request() req) {
    return this.chatsService.getConversationById(id, req.user._id);
  }

  @Post('messages')
  async createMessage(@Body() createDto: CreateMessageDto, @Request() req) {
    const message = await this.chatsService.createMessage(createDto, req.user._id);
    
    // Emit to socket
    this.chatsGateway.emitNewMessage(createDto.conversationId, message);
    
    return message;
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    return this.chatsService.getMessages(conversationId, req.user._id, pageNum, limitNum);
  }

  @Patch('conversations/:conversationId/read')
  async markMessagesAsRead(@Param('conversationId') conversationId: string, @Request() req) {
    const result = await this.chatsService.markMessagesAsRead(conversationId, req.user._id);
    
    // Emit read status
    this.chatsGateway.emitMessageRead(conversationId, {
      userId: req.user._id,
      conversationId,
    });
    
    return result;
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Request() req) {
    return this.chatsService.deleteConversation(id, req.user._id);
  }
}

