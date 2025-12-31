import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { AuthService } from '@/auth/auth.service';

@WebSocketGateway({
  namespace: '/chats',
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatsGateway');
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private chatsService: ChatsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth?.token || client.handshake.headers?.authorization;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Remove 'Bearer ' prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }
      
      const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
      const payload = this.jwtService.verify(token, { secret });
      
      if (payload && payload.email) {
        // Get user from auth service
        const user = await this.authService.getUser(payload.email);
        if (user && user._id) {
          const userId = user._id.toString();
          this.userSockets.set(userId, client.id);
          client.data.userId = userId;
          this.logger.log(`Client ${client.id} connected as user ${userId}`);
        } else {
          this.logger.warn(`Client ${client.id} connected but user not found`);
          client.disconnect();
        }
      } else {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client ${client.id} disconnected (user ${userId})`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      this.logger.warn(`Client ${client.id} tried to join conversation without userId`);
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Verify user is participant
      await this.chatsService.getConversationById(conversationId, userId);
      client.join(`conversation:${conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${conversationId} (socket: ${client.id})`);
      // Emit confirmation back to client
      client.emit('joined:conversation', { conversationId, success: true });
      return { success: true, conversationId };
    } catch (error) {
      this.logger.error(`Error joining conversation ${conversationId} for user ${userId}:`, error);
      client.emit('joined:conversation', { conversationId, success: false, error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
    return { success: true, conversationId };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      this.logger.warn(`Client ${client.id} tried to send typing without userId`);
      return { success: false, error: 'Unauthorized' };
    }

    const { conversationId, isTyping } = data;
    
    // Broadcast typing status to all other participants in the conversation
    // Exclude the sender by emitting to the room (which includes all participants)
    // The frontend will filter out its own typing status
    this.server.to(`conversation:${conversationId}`).emit('typing', {
      userId,
      conversationId,
      isTyping,
    });

    return { success: true };
  }

  // Emit new message to conversation room
  emitNewMessage(conversationId: string, message: any) {
    this.logger.log(`Emitting new message to conversation ${conversationId}:`, {
      messageId: message._id,
      senderId: message.senderId?._id || message.senderId,
      content: message.content?.substring(0, 50),
    });
    
    // Get room size for debugging (safely)
    try {
      const adapter = this.server?.sockets?.adapter;
      if (adapter) {
        const room = adapter.rooms?.get(`conversation:${conversationId}`);
        const roomSize = room ? room.size : 0;
        this.logger.log(`Room conversation:${conversationId} has ${roomSize} clients`);
      }
    } catch (error) {
      this.logger.warn('Could not get room size:', error);
    }
    
    // Emit message to all clients in the conversation room
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
    this.logger.log(`Message emitted to conversation:${conversationId}`);
  }

  // Emit message read status
  emitMessageRead(conversationId: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:read', data);
  }

  // Emit typing indicator
  emitTyping(conversationId: string, userId: string, isTyping: boolean) {
    this.server.to(`conversation:${conversationId}`).emit('typing', {
      userId,
      isTyping,
    });
  }

  // Get socket ID for a user
  getUserSocket(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}

