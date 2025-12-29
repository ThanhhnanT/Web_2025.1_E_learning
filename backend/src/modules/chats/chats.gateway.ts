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
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
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
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Verify user is participant
      await this.chatsService.getConversationById(conversationId, userId);
      client.join(`conversation:${conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${conversationId}`);
      return { success: true, conversationId };
    } catch (error) {
      this.logger.error(`Error joining conversation:`, error);
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

  // Emit new message to conversation room
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
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

