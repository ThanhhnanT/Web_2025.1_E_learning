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

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
  ) {}

  async createOrGetConversation(createDto: CreateConversationDto, userId: string) {
    const { participantId } = createDto;

    if (userId === participantId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Check if conversation already exists
    const existingConversation = await this.conversationModel.findOne({
      participants: { $all: [new Types.ObjectId(userId), new Types.ObjectId(participantId)] },
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
      participants: [new Types.ObjectId(userId), new Types.ObjectId(participantId)],
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

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return conversation;
  }

  async createMessage(createDto: CreateMessageDto, userId: string) {
    const { conversationId, content, type = MessageType.TEXT } = createDto;

    // Verify conversation exists and user is participant
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

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verify conversation exists and user is participant
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

    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
        deletedAt: null,
      })
      .populate('senderId', 'name email avatar_url')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return messages.reverse(); // Return in chronological order
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    // Verify conversation exists and user is participant
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

    // Mark all messages from other participants as read
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(userId) },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
    );

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

