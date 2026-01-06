import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

// Ưu tiên NEXT_PUBLIC_API_URL (cho production trên Render) sau đó mới đến API (fallback)
const API_DOMAIN = process.env.NEXT_PUBLIC_API_URL || process.env.API || 'http://localhost:8888/';
const SOCKET_URL = API_DOMAIN.replace(/\/$/, ''); // Remove trailing slash

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = Cookies.get('access_token');
    
    this.socket = io(`${SOCKET_URL}/posts`, {
      transports: ['websocket', 'polling'],
      auth: token ? { token: `Bearer ${token}` } : {},
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  joinPost(postId: string) {
    this.emit('join:post', postId);
  }

  leavePost(postId: string) {
    this.emit('leave:post', postId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();

// Export convenience functions
export const connectSocket = () => socketManager.connect();
export const disconnectSocket = () => socketManager.disconnect();
export const onSocketEvent = (event: string, callback: Function) => socketManager.on(event, callback);
export const offSocketEvent = (event: string, callback?: Function) => socketManager.off(event, callback);
export const emitSocketEvent = (event: string, data?: any) => socketManager.emit(event, data);
export const joinPostRoom = (postId: string) => socketManager.joinPost(postId);
export const leavePostRoom = (postId: string) => socketManager.leavePost(postId);

// Chat Socket Manager
class ChatSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log('Chat socket already connected:', this.socket.id);
      return this.socket;
    }

    const token = Cookies.get('access_token');
    
    if (!token) {
      console.error('No access token found for chat socket');
      return null;
    }

    console.log('Connecting to chat socket:', `${SOCKET_URL}/chats`);
    this.socket = io(`${SOCKET_URL}/chats`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Chat socket connected:', this.socket?.id);
      
      // Re-register all listeners when connected
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          console.log(`[ChatSocket] Re-registering listener for event '${event}' after connection`);
          this.socket?.on(event, callback as any);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Chat socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Chat socket reconnected after', attemptNumber, 'attempts');
      
      // Re-register all listeners when reconnected
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          console.log(`[ChatSocket] Re-registering listener for event '${event}' after reconnect`);
          this.socket?.on(event, callback as any);
        });
      });
    });

    // Register listeners that were added before connection
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      console.log(`[ChatSocket] Registering listener for event '${event}'`);
      this.socket.on(event, callback as any);
    } else {
      console.warn(`[ChatSocket] Cannot register listener for '${event}': socket not available, will register when connected`);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      console.log(`[ChatSocket] Emitting event '${event}' with data:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`[ChatSocket] Cannot emit '${event}': socket not connected`, {
        socketExists: !!this.socket,
        connected: this.socket?.connected
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatSocketManager = new ChatSocketManager();

// Chat socket convenience functions
export const connectChatSocket = () => chatSocketManager.connect();
export const disconnectChatSocket = () => chatSocketManager.disconnect();
export const onChatEvent = (event: string, callback: Function) => chatSocketManager.on(event, callback);
export const offChatEvent = (event: string, callback?: Function) => chatSocketManager.off(event, callback);
export const emitChatEvent = (event: string, data?: any) => chatSocketManager.emit(event, data);

