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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    const userId = req.user._id?.toString() || req.user._id;
    return this.chatsService.createOrGetConversation(createDto, userId);
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    const userId = req.user._id?.toString() || req.user._id;
    return this.chatsService.getConversations(userId);
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string, @Request() req) {
    const userId = req.user._id?.toString() || req.user._id;
    return this.chatsService.getConversationById(id, userId);
  }

  @Post('messages')
  @UseInterceptors(FileInterceptor('file'))
  async createMessage(
    @Body() createDto: CreateMessageDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user._id?.toString() || req.user._id;
    
    // Validate file if provided
    if (file) {
      const isImage = file.mimetype.startsWith('image/');
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      const maxImageSize = 5 * 1024 * 1024; // 5MB
      const maxFileSize = 10 * 1024 * 1024; // 10MB

      if (isImage) {
        if (!allowedImageTypes.includes(file.mimetype)) {
          throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, GIF, WEBP)');
        }
        if (file.size > maxImageSize) {
          throw new BadRequestException('Kích thước ảnh không được vượt quá 5MB');
        }
      } else {
        if (file.size > maxFileSize) {
          throw new BadRequestException('Kích thước file không được vượt quá 10MB');
        }
      }
    }
    
    // If file is provided, upload it first
    if (file) {
      const message = await this.chatsService.createMessageWithFile(createDto, userId, file);
      
      if (!message) {
        throw new Error('Failed to create message');
      }
      
      const conversationId = createDto.conversationId?.toString() || createDto.conversationId;
      const messageToEmit = {
        ...message,
        _id: message._id?.toString() || message._id,
        conversationId: message.conversationId?.toString() || conversationId,
        senderId: message.senderId?._id 
          ? { ...message.senderId, _id: message.senderId._id.toString() }
          : message.senderId,
      };
      
      this.chatsGateway.emitNewMessage(conversationId, messageToEmit);
      return message;
    }
    
    // Regular text message
    const message = await this.chatsService.createMessage(createDto, userId);
    
    if (!message) {
      throw new Error('Failed to create message');
    }
    
    // Ensure conversationId is a string for WebSocket emit
    const conversationId = createDto.conversationId?.toString() || createDto.conversationId;
    
    // Emit to socket with populated message
    // Convert conversationId to string in the message object for WebSocket
    // Ensure all ObjectId fields are converted to strings
    const messageToEmit = {
      ...message,
      _id: message._id?.toString() || message._id,
      conversationId: message.conversationId?.toString() || conversationId,
      senderId: message.senderId?._id 
        ? { ...message.senderId, _id: message.senderId._id.toString() }
        : message.senderId,
    };
    
    this.chatsGateway.emitNewMessage(conversationId, messageToEmit);
    
    return message;
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('beforeDate') beforeDate: string,
    @Request() req,
  ) {
    const userId = req.user._id?.toString() || req.user._id;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10; // Default to 10 messages
    const before = beforeDate ? new Date(beforeDate) : undefined;
    return this.chatsService.getMessages(conversationId, userId, pageNum, limitNum, before);
  }

  @Patch('conversations/:conversationId/read')
  async markMessagesAsRead(@Param('conversationId') conversationId: string, @Request() req) {
    const userId = req.user._id?.toString() || req.user._id;
    const result = await this.chatsService.markMessagesAsRead(conversationId, userId);
    
    // Emit read status
    this.chatsGateway.emitMessageRead(conversationId, {
      userId: userId,
      conversationId,
    });
    
    return result;
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Request() req) {
    return this.chatsService.deleteConversation(id, req.user._id);
  }
}

