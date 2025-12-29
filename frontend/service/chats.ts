import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

const API_DOMAIN = process.env.API || 'http://localhost:8888/';

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>;
  otherParticipant?: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  type: 'text' | 'image' | 'file' | 'link';
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Create or get conversation
export const createOrGetConversation = async (
  participantId: string,
): Promise<Conversation> => {
  return await postAccess('chats/conversations', { participantId });
};

// Get all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  return await getAccess('chats/conversations');
};

// Get conversation by ID
export const getConversationById = async (conversationId: string): Promise<Conversation> => {
  return await getAccess(`chats/conversations/${conversationId}`);
};

// Create message
export const createMessage = async (
  conversationId: string,
  content: string,
  type: 'text' | 'image' | 'file' | 'link' = 'text',
): Promise<Message> => {
  return await postAccess('chats/messages', { conversationId, content, type });
};

// Get messages
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50,
): Promise<Message[]> => {
  const params: any = {};
  if (page) params.page = page.toString();
  if (limit) params.limit = limit.toString();
  return await getAccess(`chats/conversations/${conversationId}/messages`, params);
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  return await patchAccess(`chats/conversations/${conversationId}/read`, {});
};

// Delete conversation
export const deleteConversation = async (conversationId: string): Promise<void> => {
  return await deleteAccess(`chats/conversations/${conversationId}`);
};

