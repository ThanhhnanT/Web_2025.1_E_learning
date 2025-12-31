import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schema/conversation.schema';
import { Message, MessageType } from './schema/message.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CloudinaryService } from '@/modules/users/cloudinary.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createOrGetConversation(createDto: CreateConversationDto, userId: string) {
    const { participantId } = createDto;

    // Normalize userId to string
    const userIdStr = userId?.toString() || userId;
    const participantIdStr = participantId?.toString() || participantId;

    if (userIdStr === participantIdStr) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Check if conversation already exists
    const existingConversation = await this.conversationModel.findOne({
      participants: { $all: [new Types.ObjectId(userIdStr), new Types.ObjectId(participantIdStr)] },
      deletedAt: null,
    });

    if (existingConversation) {
      return this.conversationModel
        .findById(existingConversation._id)
        .populate('participants', 'name email avatar_url')
        .populate('lastMessageBy', 'name email avatar_url')
        .lean();
    }

    // Create new conversation
    const conversation = await this.conversationModel.create({
      participants: [new Types.ObjectId(userIdStr), new Types.ObjectId(participantIdStr)],
    });

    return this.conversationModel
      .findById(conversation._id)
      .populate('participants', 'name email avatar_url')
      .populate('lastMessageBy', 'name email avatar_url')
      .lean();
  }

  async getConversations(userId: string) {
    const conversations = await this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
        deletedAt: null,
      })
      .populate('participants', 'name email avatar_url')
      .populate('lastMessageBy', 'name email avatar_url')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.messageModel.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: new Types.ObjectId(userId) },
          read: false,
          deletedAt: null,
        });

        // Get the other participant (not the current user)
        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId,
        );

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      }),
    );

    return conversationsWithUnread;
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants', 'name email avatar_url')
      .populate('lastMessageBy', 'name email avatar_url')
      .lean();

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Normalize userId to string for comparison
    const userIdStr = userId?.toString();
    
    // Check if user is a participant
    // Handle both populated (object with _id) and non-populated (ObjectId) participants
    const isParticipant = conversation.participants.some((p: any) => {
      if (!p) return false;
      // If populated, p will have _id
      if (p._id) {
        return p._id.toString() === userIdStr;
      }
      // If not populated, p is ObjectId
      return p.toString() === userIdStr;
    });

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return conversation;
  }

  async createMessage(createDto: CreateMessageDto, userId: string) {
    const { conversationId, content = '', type = MessageType.TEXT } = createDto;

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Normalize userId to string for comparison
    const userIdStr = userId?.toString();
    
    const isParticipant = conversation.participants.some(
      (id) => id?.toString() === userIdStr,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Create message
    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(userId),
      content,
      type,
      read: false,
    });

    // Update conversation last message
    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageBy = new Types.ObjectId(userId);
    await conversation.save();

    return this.messageModel
      .findById(message._id)
      .populate('senderId', 'name email avatar_url')
      .lean();
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 10, beforeDate?: Date) {
    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Normalize userId to string for comparison
    const userIdStr = userId?.toString();

    const isParticipant = conversation.participants.some(
      (id) => id?.toString() === userIdStr,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Build query - optimized for loading from the end (newest first)
    const query: any = {
      conversationId: new Types.ObjectId(conversationId),
      deletedAt: null,
    };

    // If beforeDate is provided, load messages before this date (for pagination)
    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }

    // Use cursor-based pagination for better performance
    // Load newest messages first (createdAt: -1 uses the compound index efficiently)
    const messages = await this.messageModel
      .find(query)
      .populate('senderId', 'name email avatar_url')
      .sort({ createdAt: -1 }) // Sort by newest first (uses index: conversationId: 1, createdAt: -1)
      .limit(limit)
      .lean();

    // Return in reverse order (oldest to newest) for display
    // This way newest messages appear at the bottom
    return messages.reverse();
  }

  async createMessageWithFile(createDto: CreateMessageDto, userId: string, file: Express.Multer.File) {
    const { conversationId, content, type } = createDto;

    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Normalize userId to string for comparison
    const userIdStr = userId?.toString();
    
    const isParticipant = conversation.participants.some(
      (id) => id?.toString() === userIdStr,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Determine message type based on file
    let messageType = type;
    let fileUrl = '';

    if (file) {
      // Validate file type
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
        messageType = MessageType.IMAGE;
        // Upload image to Cloudinary
        fileUrl = await this.cloudinaryService.uploadImage(file, 'chat_images');
      } else {
        if (file.size > maxFileSize) {
          throw new BadRequestException('Kích thước file không được vượt quá 10MB');
        }
        messageType = MessageType.FILE;
        // Upload file to Cloudinary (as raw file)
        fileUrl = await this.cloudinaryService.uploadImage(file, 'chat_files');
      }
    }

    // Use file URL as content if it's an image or file
    const messageContent = fileUrl || content || '';

    // Create message
    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(userId),
      content: messageContent,
      type: messageType,
      fileName: file ? file.originalname : undefined,
      read: false,
    });

    // Update conversation last message
    const isImageMessage = messageType === MessageType.IMAGE;
    conversation.lastMessage = isImageMessage ? '[Ảnh]' : (messageType === MessageType.FILE ? '[File]' : content);
    conversation.lastMessageAt = new Date();
    conversation.lastMessageBy = new Types.ObjectId(userId);
    await conversation.save();

    return this.messageModel
      .findById(message._id)
      .populate('senderId', 'name email avatar_url')
      .lean();
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    // Verify conversation exists and user is participant
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    // Normalize userId to string for comparison
    const userIdStr = userId?.toString();

    const isParticipant = conversation.participants.some(
      (id) => id?.toString() === userIdStr,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Mark only the latest unread message from other participants as read
    // Find the latest unread message
    const latestUnreadMessage = await this.messageModel
      .findOne({
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(userId) },
        read: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (latestUnreadMessage) {
      latestUnreadMessage.read = true;
      latestUnreadMessage.readAt = new Date();
      await latestUnreadMessage.save();
    }

    return { message: 'Messages marked as read' };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    conversation.deletedAt = new Date();
    await conversation.save();

    return { message: 'Conversation deleted successfully' };
  }
}

