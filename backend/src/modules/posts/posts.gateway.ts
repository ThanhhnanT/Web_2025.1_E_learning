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

@WebSocketGateway({
  namespace: '/posts',
  cors: {
    origin: '*',
  },
})
export class PostsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('PostsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Join room for a specific post
  @SubscribeMessage('join:post')
  handleJoinPost(@ConnectedSocket() client: Socket, @MessageBody() postId: string) {
    client.join(`post:${postId}`);
    this.logger.log(`Client ${client.id} joined post:${postId}`);
    return { success: true, postId };
  }

  // Leave room for a specific post
  @SubscribeMessage('leave:post')
  handleLeavePost(@ConnectedSocket() client: Socket, @MessageBody() postId: string) {
    client.leave(`post:${postId}`);
    this.logger.log(`Client ${client.id} left post:${postId}`);
    return { success: true, postId };
  }

  // Emit events (called from service)
  emitPostCreated(post: any) {
    this.server.emit('post:created', post);
  }

  emitPostUpdated(post: any) {
    this.server.emit('post:updated', post);
  }

  emitPostDeleted(postId: string) {
    this.server.emit('post:deleted', { postId });
  }

  emitPostLiked(postId: string, data: any) {
    this.server.to(`post:${postId}`).emit('post:liked', { postId, ...data });
    this.server.emit('post:liked', { postId, ...data }); // Also emit globally for feed updates
  }

  emitCommentCreated(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('comment:created', { postId, comment });
  }

  emitCommentUpdated(postId: string, comment: any) {
    this.server.to(`post:${postId}`).emit('comment:updated', { postId, comment });
  }

  emitCommentDeleted(postId: string, commentId: string) {
    this.server.to(`post:${postId}`).emit('comment:deleted', { postId, commentId });
  }

  emitCommentReaction(postId: string, commentId: string, data: any) {
    this.server.to(`post:${postId}`).emit('comment:reaction', { postId, commentId, ...data });
  }

  emitPostReaction(postId: string, data: any) {
    this.server.to(`post:${postId}`).emit('post:reaction', { postId, ...data });
    this.server.emit('post:reaction', { postId, ...data }); // Also emit globally for feed updates
  }
}

