"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Input, Button, message, Card, Space, Typography, Badge, Spin, Modal } from 'antd';
import { UserOutlined, SendOutlined, CloseOutlined, MinusOutlined, PaperClipOutlined, SmileOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { createMessage, getMessages, markMessagesAsRead, type Message, type Conversation } from '@/service/chats';
import { connectChatSocket, disconnectChatSocket, onChatEvent, offChatEvent, emitChatEvent } from '@/lib/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import styles from './ChatPopup.module.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatPopupProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onMinimize?: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({
  conversation,
  currentUserId,
  onClose,
  onMinimize,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [readByFriend, setReadByFriend] = useState<Set<string>>(new Set()); // Messages read by friend
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const pendingMessageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const scrollPositionRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const initialLoadRef = useRef<boolean>(true);

  const otherParticipant = conversation.otherParticipant || conversation.participants?.find(
    (p: any) => {
      const pId = typeof p === 'string' ? p : (p._id || p._id?.toString());
      return pId !== currentUserId;
    }
  );

  useEffect(() => {
    // Reset retry count when conversation changes
    retryCountRef.current = 0;
    initialLoadRef.current = true;
    
    // Connect to chat socket
    const socket = connectChatSocket();
    if (!socket) {
      console.error('Failed to connect chat socket');
      return;
    }
    socketConnectedRef.current = true;

    // Listen for new messages - register this FIRST before joining
    const handleNewMessage = (newMessage: any) => {
      console.log('Received new message via WebSocket:', newMessage);
      console.log('Current conversation ID:', conversation._id);
      console.log('Message conversation ID:', newMessage.conversationId);
      
      // Handle both string and object conversationId
      const messageConvId = typeof newMessage.conversationId === 'object' 
        ? (newMessage.conversationId._id?.toString() || newMessage.conversationId.toString())
        : (newMessage.conversationId?.toString() || newMessage.conversationId);
      const currentConvId = conversation._id.toString();
      
      console.log('Comparing conversation IDs:', { messageConvId, currentConvId, match: messageConvId === currentConvId });
      
      if (messageConvId === currentConvId) {
        // Check if message already exists or if we have an optimistic message to replace
        setMessages((prev) => {
          const newMsgId = newMessage._id?.toString() || newMessage._id;
          const senderId = typeof newMessage.senderId === 'object' 
            ? (newMessage.senderId._id?.toString() || newMessage.senderId._id)
            : (newMessage.senderId?.toString() || newMessage.senderId);
          const isOwnMessage = senderId === currentUserId;
          
          // Check if message already exists by ID
          const existingIndex = prev.findIndex((msg) => {
            const msgId = msg._id?.toString() || msg._id;
            return msgId === newMsgId;
          });
          
          if (existingIndex !== -1) {
            console.log('Message already exists, skipping duplicate');
            return prev;
          }
          
          // If this is our own message, check for optimistic message to replace
          if (isOwnMessage) {
            const optimisticIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              // Check if it's a temp message with matching content and type
              if (msgId && msgId.startsWith('temp-')) {
                const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
                if (msgSenderId === currentUserId && 
                    msg.content === newMessage.content && 
                    msg.type === newMessage.type) {
                  // For files, also check fileName
                  if (msg.type === 'file' || msg.type === 'image') {
                    return msg.fileName === newMessage.fileName;
                  }
                  return true;
                }
              }
              return false;
            });
            
            if (optimisticIndex !== -1) {
              console.log('Replacing optimistic message with real message from WebSocket');
              const updated = [...prev];
              updated[optimisticIndex] = newMessage;
              return updated;
            }
            
            // Also check if message with same content already exists (from createMessage response)
            const duplicateIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              // Don't check temp messages here
              if (msgId && msgId.startsWith('temp-')) {
                return false;
              }
              // Check if real message with same ID or content already exists
              return msgId === newMsgId || 
                     (msg.content === newMessage.content && 
                      msg.type === newMessage.type &&
                      msg.senderId._id?.toString() === currentUserId);
            });
            
            if (duplicateIndex !== -1) {
              console.log('Message already exists (from createMessage), skipping duplicate from WebSocket');
              return prev;
            }
          }
          
          console.log('Adding new message to list via WebSocket');
          
          // Clear any pending fallback timeout for this message
          if (newMsgId && pendingMessageTimeoutsRef.current.has(newMsgId)) {
            clearTimeout(pendingMessageTimeoutsRef.current.get(newMsgId));
            pendingMessageTimeoutsRef.current.delete(newMsgId);
          }
          
          return [...prev, newMessage];
        });
        scrollToBottom();
        
        // Mark as read if message is from other participant
        const senderId = typeof newMessage.senderId === 'object' 
          ? (newMessage.senderId._id?.toString() || newMessage.senderId._id)
          : (newMessage.senderId?.toString() || newMessage.senderId);
        if (senderId !== currentUserId) {
          markMessagesAsRead(conversation._id).catch(console.error);
          
          // When friend sends a message, automatically mark our latest message as read
          // because they must have seen it to send a reply
          setMessages((prev) => {
            // Find the latest message from current user that hasn't been read
            const latestUnreadIndex = prev.findLastIndex((msg) => {
              const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
              return msgSenderId === currentUserId && !msg.read;
            });
            
            if (latestUnreadIndex !== -1) {
              const updated = [...prev];
              updated[latestUnreadIndex] = {
                ...updated[latestUnreadIndex],
                read: true,
                readAt: new Date().toISOString(),
              };
              return updated;
            }
            return prev;
          });
          
          // Mark the friend's new message as "read by friend" (they saw our message when sending)
          const newMessageId = newMessage._id?.toString() || newMessage._id;
          if (newMessageId) {
            setReadByFriend((prev) => new Set(prev).add(newMessageId));
          }
        }
      } else {
        console.log('Message for different conversation, ignoring', {
          messageConvId,
          currentConvId
        });
      }
    };

    // Register message listener BEFORE joining room
    onChatEvent('message:new', handleNewMessage);
    
    // Listen for join confirmation
    const handleJoinConfirmation = (data: any) => {
      const dataConvId = typeof data.conversationId === 'object' 
        ? (data.conversationId._id?.toString() || data.conversationId.toString())
        : (data.conversationId?.toString() || data.conversationId);
      const currentConvId = conversation._id.toString();
      
      if (dataConvId === currentConvId) {
        if (data.success) {
          console.log('Successfully joined conversation:', conversation._id);
        } else {
          console.error('Failed to join conversation:', data.error);
        }
      }
    };
    
    onChatEvent('joined:conversation', handleJoinConfirmation);
    
    // Handle message read status updates
    const handleMessageRead = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversation._id) return;
      
      // Mark only the latest message from current user as read
      setMessages((prev) => {
        // Find the latest message from current user that hasn't been read
        const latestUnreadIndex = prev.findLastIndex((msg) => {
          const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
          return msgSenderId === currentUserId && !msg.read;
        });
        
        if (latestUnreadIndex !== -1) {
          const updated = [...prev];
          updated[latestUnreadIndex] = {
            ...updated[latestUnreadIndex],
            read: true,
            readAt: new Date().toISOString(),
          };
          return updated;
        }
        return prev;
      });
    };
    
    onChatEvent('message:read', handleMessageRead);
    
    // Handle typing indicator
    const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversation._id) return;
      if (data.userId === currentUserId) return; // Don't show own typing status
      
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };
    
    onChatEvent('typing', handleTyping);
    
    // Wait for socket to be connected before joining
    const setupSocket = () => {
      if (socket.connected) {
        console.log('Socket already connected, joining conversation:', conversation._id);
        // Join conversation room
        setTimeout(() => {
          emitChatEvent('join:conversation', conversation._id);
        }, 100);
      } else {
        // Wait for connection
        const connectHandler = () => {
          console.log('Socket connected, joining conversation:', conversation._id);
          // Small delay to ensure socket is fully ready
          setTimeout(() => {
            emitChatEvent('join:conversation', conversation._id);
          }, 100);
        };
        socket.once('connect', connectHandler);
      }
    };
    
    setupSocket();

    // Add a delay before loading messages to ensure conversation is fully set up
    // Increased delay to allow backend to complete participant setup
    // Load from the end (most recent messages first)
    const loadTimer = setTimeout(() => {
      loadMessages(false, 1, false);
    }, 500);

    // Mark messages as read when opening (with error handling)
    const markReadTimer = setTimeout(() => {
      markMessagesAsRead(conversation._id).catch((error) => {
        // Silently handle "not a participant" errors as they may occur during conversation setup
        if (error?.response?.status !== 403) {
          console.error('Error marking messages as read:', error);
        }
      });
    }, 200);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(markReadTimer);
      // Clear all pending message timeouts
      pendingMessageTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      pendingMessageTimeoutsRef.current.clear();
      offChatEvent('message:new', handleNewMessage);
      offChatEvent('joined:conversation', handleJoinConfirmation);
      offChatEvent('message:read', handleMessageRead);
      offChatEvent('typing', handleTyping);
      // Stop typing when leaving
      if (isTypingRef.current) {
        emitChatEvent('typing', { conversationId: conversation._id, isTyping: false });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitChatEvent('leave:conversation', conversation._id);
    };
  }, [conversation._id, currentUserId]);

  useEffect(() => {
    // Only auto-scroll to bottom when new messages arrive (not when loading old messages or initial load)
    // Skip if initial load is still in progress
    if (!loadingMore && !initialLoadRef.current && messages.length > 0) {
      // Check if this is a new message (not initial load)
      // Only scroll if messages changed and it's not the initial load
      scrollToBottom();
    }
  }, [messages, loadingMore]);

  useEffect(() => {
    // Auto-scroll when typing indicator appears (but not during initial load)
    if (typingUsers.size > 0 && !initialLoadRef.current) {
      scrollToBottom();
    }
  }, [typingUsers]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const loadMessages = async (isRetry = false, page: number = 1, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else if (!isRetry) {
        setLoading(true);
      }
      
      // Check if current user is in participants before loading
      // Handle both populated (object) and non-populated (string) participants
      const isParticipant = conversation.participants?.some((p: any) => {
        if (typeof p === 'string') {
          return p === currentUserId;
        }
        return p._id === currentUserId || p._id?.toString() === currentUserId;
      });
      
      if (!isParticipant && conversation.participants && conversation.participants.length > 0) {
        console.warn('Current user is not a participant yet, will retry...', {
          currentUserId,
          participants: conversation.participants.map((p: any) => typeof p === 'string' ? p : p._id)
        });
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 3000);
          console.log(`Retrying load messages (attempt ${retryCountRef.current}/${maxRetries}) after ${delay}ms`);
          setTimeout(() => {
            loadMessages(true, page, loadMore);
          }, delay);
          return;
        } else {
          console.error('Max retries reached, user still not a participant');
          setLoading(false);
          setLoadingMore(false);
          message.warning('Cuộc trò chuyện chưa sẵn sàng. Vui lòng đóng và thử lại.');
          return;
        }
      }

      const limit = 10; // Load 10 messages per page for better performance
      
      // For loading older messages, use the oldest message's date as cursor
      let beforeDate: Date | undefined;
      if (loadMore && messages.length > 0) {
        // Get the oldest message's date (first in array since we reverse)
        const oldestMessage = messages[0];
        if (oldestMessage?.createdAt) {
          beforeDate = new Date(oldestMessage.createdAt);
        }
      }
      
      const loadedMessages = await getMessages(conversation._id, page, limit, beforeDate);
      
      if (loadMore) {
        // When loading more (older messages), prepend to existing messages
        // Save scroll position before adding messages
        const container = chatContainerRef.current;
        if (container) {
          scrollPositionRef.current = container.scrollHeight - container.scrollTop;
        }
        
        setMessages((prev) => {
          // Merge and remove duplicates
          const existingIds = new Set(prev.map(m => m._id));
          const newMessages = loadedMessages.filter(m => !existingIds.has(m._id));
          return [...newMessages, ...prev];
        });
        
        // Restore scroll position after messages are added
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - scrollPositionRef.current;
          }
        }, 0);
        
        setLoadingMore(false);
        setHasMore(loadedMessages.length === limit);
        setCurrentPage(page);
      } else {
        // Initial load - load from the end (most recent messages)
        setMessages(loadedMessages);
        retryCountRef.current = 0; // Reset retry count on success
        setLoading(false);
        setHasMore(loadedMessages.length === limit);
        setCurrentPage(1);
        // Set scroll to bottom immediately without smooth animation
        // Use multiple requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const container = chatContainerRef.current;
            if (container) {
              // Set scroll immediately without animation
              container.scrollTop = container.scrollHeight;
              // Mark initial load as complete
              initialLoadRef.current = false;
            } else {
              // If container not ready, try again after a short delay
              setTimeout(() => {
                const container = chatContainerRef.current;
                if (container) {
                  container.scrollTop = container.scrollHeight;
                  initialLoadRef.current = false;
                }
              }, 50);
            }
          });
        });
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setLoadingMore(false);
      // Don't show error for 403 (not a participant) as it may be temporary during setup
      if (error?.response?.status !== 403) {
        if (!loadMore) {
          message.error('Không thể tải tin nhắn');
          setLoading(false);
        }
      } else {
        // Retry with exponential backoff, max 3 retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 3000); // 1s, 2s, 3s
          console.log(`Retrying load messages (attempt ${retryCountRef.current}/${maxRetries}) after ${delay}ms`);
          setTimeout(() => {
            loadMessages(true, page, loadMore);
          }, delay);
        } else {
          console.error('Max retries reached, giving up on loading messages');
          setLoading(false);
          setLoadingMore(false);
          // Show a user-friendly message
          message.warning('Cuộc trò chuyện chưa sẵn sàng. Vui lòng đóng và thử lại.');
        }
      }
    }
  };

  const loadMoreMessages = () => {
    if (!loadingMore && hasMore) {
      loadMessages(false, currentPage + 1, true);
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Load more when scrolled near the top (within 100px)
    if (container.scrollTop < 100 && !loadingMore && hasMore) {
      loadMoreMessages();
    }
  };

  const scrollToBottom = (instant = false) => {
    if (instant) {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = files.map((file) => {
        const fileItem: { file: File; preview?: string } = { file };
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedFiles((prev) => {
              const updated = [...prev];
              const index = updated.findIndex((item) => item.file === file);
              if (index !== -1) {
                updated[index] = { ...updated[index], preview: reader.result as string };
              }
              return updated;
            });
          };
          reader.readAsDataURL(file);
        }
        
        return fileItem;
      });
      
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || sending) return;

    // Stop typing indicator when sending
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitChatEvent('typing', { conversationId: conversation._id, isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Check if user is participant before sending
    const isParticipant = conversation.participants?.some((p: any) => {
      if (typeof p === 'string') {
        return p === currentUserId;
      }
      return p._id === currentUserId || p._id?.toString() === currentUserId;
    });

    if (!isParticipant && conversation.participants && conversation.participants.length > 0) {
      message.warning('Cuộc trò chuyện chưa sẵn sàng. Vui lòng đợi một chút.');
      return;
    }

    try {
      setSending(true);
      const messageContent = inputValue.trim();
      const filesToSend = [...selectedFiles];
      
      // Don't clear input - keep it for better UX (like Facebook)
      // setInputValue('');
      // setSelectedFiles([]);
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = '';
      // }
      
      // Send text message first if there's content
      if (messageContent) {
        // Create optimistic message
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage: Message = {
          _id: tempId,
          conversationId: conversation._id,
          senderId: {
            _id: currentUserId,
            name: '',
            email: '',
            avatar_url: undefined,
          },
          type: 'text',
          content: messageContent,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Add optimistic message immediately
        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom();
        
        // Clear input after adding optimistic message
        setInputValue('');
        
        try {
          const newMessage = await createMessage(
            conversation._id,
            messageContent,
            'text',
            undefined
          );
          const messageId = newMessage._id?.toString() || newMessage._id;
          
          // Replace optimistic message with real message
          setMessages((prev) => {
            // First check if message already exists (from WebSocket)
            const existsIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              return msgId === messageId;
            });
            
            if (existsIndex !== -1) {
              // Message already exists from WebSocket, just remove optimistic
              console.log('Text message already exists from WebSocket, removing optimistic');
              return prev.filter((msg) => {
                const msgId = msg._id?.toString() || msg._id;
                return msgId !== tempId;
              });
            }
            
            // Find optimistic message to replace
            const optimisticIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              return msgId === tempId;
            });
            
            if (optimisticIndex !== -1) {
              console.log('Replacing optimistic text message with real message from createMessage');
              const updated = [...prev];
              updated[optimisticIndex] = newMessage;
              return updated;
            }
            
            // If optimistic not found but message doesn't exist, add it
            console.log('Optimistic text message not found, adding real message');
            return [...prev, newMessage];
          });
          
          if (messageId) {
            const fallbackTimeout = setTimeout(() => {
              setMessages((prev) => {
                const exists = prev.some((msg) => {
                  const msgId = msg._id?.toString() || msg._id;
                  return msgId === messageId;
                });
                if (!exists) {
                  console.log('Message not received via WebSocket after 1.5s, adding manually as fallback');
                  // Remove optimistic if exists
                  const withoutOptimistic = prev.filter((msg) => {
                    const msgId = msg._id?.toString() || msg._id;
                    return msgId !== tempId;
                  });
                  return [...withoutOptimistic, newMessage];
                }
                return prev;
              });
              scrollToBottom();
              pendingMessageTimeoutsRef.current.delete(messageId);
            }, 1500);
            
            pendingMessageTimeoutsRef.current.set(messageId, fallbackTimeout);
          }
        } catch (error) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter((msg) => {
            const msgId = msg._id?.toString() || msg._id;
            return msgId !== tempId;
          }));
          throw error;
        }
      }
      
      // Send each file as a separate message
      for (const fileItem of filesToSend) {
        const file = fileItem.file;
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';
        
        // Create optimistic message for file
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage: Message = {
          _id: tempId,
          conversationId: conversation._id,
          senderId: {
            _id: currentUserId,
            name: '',
            email: '',
            avatar_url: undefined,
          },
          type: fileType,
          content: fileItem.preview || '',
          fileName: file.name,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Add optimistic message immediately
        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom();
        
        try {
          const newMessage = await createMessage(
            conversation._id,
            ' ', // Send a space as placeholder (backend requires non-empty but we use file URL as content)
            fileType,
            file
          );
          
          const messageId = newMessage._id?.toString() || newMessage._id;
          
          // Replace optimistic message with real message
          setMessages((prev) => {
            // First check if message already exists (from WebSocket)
            const existsIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              return msgId === messageId;
            });
            
            if (existsIndex !== -1) {
              // Message already exists from WebSocket, just remove optimistic
              console.log('File message already exists from WebSocket, removing optimistic');
              return prev.filter((msg) => {
                const msgId = msg._id?.toString() || msg._id;
                return msgId !== tempId;
              });
            }
            
            // Find optimistic message to replace
            const optimisticIndex = prev.findIndex((msg) => {
              const msgId = msg._id?.toString() || msg._id;
              return msgId === tempId;
            });
            
            if (optimisticIndex !== -1) {
              console.log('Replacing optimistic file message with real message from createMessage');
              const updated = [...prev];
              updated[optimisticIndex] = newMessage;
              return updated;
            }
            
            // If optimistic not found but message doesn't exist, add it
            console.log('Optimistic file message not found, adding real message');
            return [...prev, newMessage];
          });
          
          if (messageId) {
            const fallbackTimeout = setTimeout(() => {
              setMessages((prev) => {
                const exists = prev.some((msg) => {
                  const msgId = msg._id?.toString() || msg._id;
                  return msgId === messageId;
                });
                if (!exists) {
                  console.log('File message not received via WebSocket after 1.5s, adding manually as fallback');
                  // Remove optimistic if exists
                  const withoutOptimistic = prev.filter((msg) => {
                    const msgId = msg._id?.toString() || msg._id;
                    return msgId !== tempId;
                  });
                  return [...withoutOptimistic, newMessage];
                }
                return prev;
              });
              scrollToBottom();
              pendingMessageTimeoutsRef.current.delete(messageId);
            }, 1500);
            
            pendingMessageTimeoutsRef.current.set(messageId, fallbackTimeout);
          }
        } catch (error) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter((msg) => {
            const msgId = msg._id?.toString() || msg._id;
            return msgId !== tempId;
          }));
          throw error;
        }
        
        // Small delay between file uploads to avoid overwhelming the server
        if (filesToSend.indexOf(fileItem) < filesToSend.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Clear selected files after sending
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error?.response?.status === 403) {
        message.warning('Bạn chưa được thêm vào cuộc trò chuyện. Vui lòng đóng và thử lại.');
      } else {
        message.error(error?.message || error?.response?.data?.message || 'Gửi tin nhắn thất bại');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Không thể tải file. Vui lòng thử lại.');
    }
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm');
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    const today = dayjs();
    
    if (date.isSame(today, 'day')) {
      return 'Hôm nay';
    } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Hôm qua';
    } else {
      return date.format('DD/MM/YYYY');
    }
  };

  const groupedMessages = messages.reduce((groups: any[], message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const shouldShowDate = !prevMessage || 
      dayjs(message.createdAt).format('DD/MM/YYYY') !== dayjs(prevMessage.createdAt).format('DD/MM/YYYY');
    
    if (shouldShowDate) {
      groups.push({ type: 'date', date: formatDate(message.createdAt) });
    }
    
    groups.push(message);
    return groups;
  }, []);

  return (
    <Card
      className={styles.chatPopup}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.avatarWrapper}>
            <Badge dot color="#10b981" offset={[-2, 2]}>
              <Avatar
                src={otherParticipant?.avatar_url}
                icon={!otherParticipant?.avatar_url && <UserOutlined />}
                size={40}
              />
            </Badge>
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
              {otherParticipant?.name || 'Unknown'}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
              Online
            </Text>
          </div>
        </div>
        <Space className={styles.headerActions}>
          {onMinimize && (
            <Button
              type="text"
              icon={<MinusOutlined />}
              onClick={onMinimize}
              className={styles.headerButton}
              aria-label="Minimize chat"
            />
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className={`${styles.headerButton} ${styles.closeButton}`}
            aria-label="Close chat"
          />
        </Space>
      </div>

      {/* Chat History */}
      <div 
        ref={chatContainerRef} 
        className={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className={styles.loadingState}>
            <Spin size="small" />
            <div style={{ marginTop: 8 }}>Đang tải...</div>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Spin size="small" />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#94a3b8' }}>Đang tải thêm...</div>
              </div>
            )}
            <div ref={messagesTopRef} />
            {groupedMessages.length === 0 ? (
              <div className={styles.emptyState}>Chưa có tin nhắn nào</div>
            ) : (
              groupedMessages.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className={styles.dateSeparator}>
                  <Badge className={styles.dateBadge}>{item.date}</Badge>
                </div>
              );
            }

            const message = item as Message;
            // Normalize senderId for comparison (senderId is always an object with _id)
            const messageSenderId = message.senderId._id?.toString() || message.senderId._id;
            const isOwnMessage = messageSenderId === currentUserId;
            
            // Show avatar at the last message in a group (like Facebook)
            // Avatar shows when: next message is from different sender, or it's the last message, or next is a date separator
            const nextItem = groupedMessages[index + 1];
            const nextMessage = nextItem?.type !== 'date' ? (nextItem as Message) : null;
            const nextSenderId = nextMessage 
              ? (nextMessage.senderId._id?.toString() || nextMessage.senderId._id)
              : null;
            
            const showAvatar = !isOwnMessage && (
              index === groupedMessages.length - 1 ||
              nextItem?.type === 'date' ||
              (nextSenderId !== null && nextSenderId !== messageSenderId)
            );

            // Show checkmark/avatar only at the last message in a group (like Facebook)
            const showCheckmark = isOwnMessage && (
              index === groupedMessages.length - 1 ||
              nextItem?.type === 'date' ||
              (nextSenderId !== null && nextSenderId !== messageSenderId)
            );

            // Show read avatar only at the latest read message (the last message in the entire list that is read)
            // Find the latest message from current user that is read
            const latestReadMessageIndex = messages.findLastIndex((msg) => {
              const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
              return msgSenderId === currentUserId && msg.read;
            });
            const isLatestReadMessage = latestReadMessageIndex !== -1 && 
              (message._id?.toString() || message._id) === (messages[latestReadMessageIndex]._id?.toString() || messages[latestReadMessageIndex]._id);
            
            // Find the latest message from current user (read or unread)
            const latestOwnMessageIndex = messages.findLastIndex((msg) => {
              const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
              return msgSenderId === currentUserId;
            });
            const isLatestOwnMessage = latestOwnMessageIndex !== -1 && 
              (message._id?.toString() || message._id) === (messages[latestOwnMessageIndex]._id?.toString() || messages[latestOwnMessageIndex]._id);
            
            // Find the latest message from friend
            const latestFriendMessageIndex = messages.findLastIndex((msg) => {
              const msgSenderId = msg.senderId._id?.toString() || msg.senderId._id;
              return msgSenderId !== currentUserId;
            });
            const isLatestFriendMessage = latestFriendMessageIndex !== -1 && 
              (message._id?.toString() || message._id) === (messages[latestFriendMessageIndex]._id?.toString() || messages[latestFriendMessageIndex]._id);
            
            // Check previous message to determine if this is the first message in a group
            const prevItem = index > 0 ? groupedMessages[index - 1] : null;
            const prevMessage = prevItem?.type !== 'date' ? (prevItem as Message) : null;
            const prevSenderId = prevMessage 
              ? (prevMessage.senderId._id?.toString() || prevMessage.senderId._id)
              : null;

            // Show time at the first message in a group (not the last)
            const showTime = (
              index === 0 ||
              prevItem?.type === 'date' ||
              (prevSenderId !== null && prevSenderId !== messageSenderId)
            );

            return (
              <div
                key={message._id}
                className={`${styles.messageWrapper} ${isOwnMessage ? styles.messageWrapperOwn : ''}`}
              >
                {!isOwnMessage && (
                  <div className={styles.avatarContainer}>
                    {showAvatar ? (
                      <Avatar
                        src={message.senderId.avatar_url}
                        icon={!message.senderId.avatar_url && <UserOutlined />}
                        size={32}
                      />
                    ) : (
                      <div style={{ width: 32, height: 32 }} />
                    )}
                  </div>
                )}
                <div
                  className={`${styles.messageContent} ${isOwnMessage ? styles.messageContentOwn : ''}`}
                >
                  {showTime && (
                    <div className={styles.messageTimeWrapper}>
                      <Text className={styles.messageTime}>{formatTime(message.createdAt)}</Text>
                    </div>
                  )}
                  <div
                    className={`${styles.messageBubble} ${
                      message.type === 'image' 
                        ? styles.messageBubbleImage 
                        : isOwnMessage 
                          ? styles.messageBubbleOwn 
                          : styles.messageBubbleOther
                    }`}
                  >
                    {message.type === 'image' ? (
                      <img 
                        src={message.content} 
                        alt="Message image" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'block',
                          border: 'none',
                          outline: 'none'
                        }}
                        onClick={() => setImagePreview(message.content)}
                      />
                    ) : message.type === 'file' ? (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleFileDownload(message.content, message.fileName || 'file')}
                      >
                        <PaperClipOutlined />
                        <span style={{ color: isOwnMessage ? 'white' : '#137fec' }}>
                          {message.fileName || 'Tải file'}
                        </span>
                      </div>
                    ) : (
                      <span 
                        className={styles.messageText} 
                        style={{ 
                          whiteSpace: message.content.length <= 20 ? 'nowrap' : 'pre-wrap',
                          wordBreak: 'break-word',
                          display: 'inline-block'
                        }}
                      >
                        {message.content}
                      </span>
                    )}
                  </div>
                  {isOwnMessage && showCheckmark && isLatestOwnMessage && (
                    <div className={styles.messageReadIndicator}>
                      {(() => {
                        const messageId = message._id?.toString() || message._id;
                        const isOptimistic = messageId && messageId.startsWith('temp-');
                        
                        // If optimistic message, show "Đang gửi..."
                        if (isOptimistic) {
                          return (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Đang gửi...
                            </span>
                          );
                        }
                        
                        // If read, show avatar
                        if (message.read && isLatestReadMessage) {
                          return (
                            <Avatar
                              src={otherParticipant?.avatar_url}
                              icon={!otherParticipant?.avatar_url && <UserOutlined />}
                              size={16}
                            />
                          );
                        }
                        
                        // If sent but not read, show tick
                        return (
                          <CheckCircleOutlined style={{ fontSize: '12px', color: '#137fec' }} />
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
            )}
            <div ref={messagesEndRef} />
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className={styles.messageWrapper}>
                <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                  {(() => {
                    // Get first typing user's avatar
                    const firstTypingUserId = Array.from(typingUsers)[0];
                    let typingUser: any = null;
                    
                    // Check otherParticipant first
                    if (conversation.otherParticipant) {
                      const otherId = typeof conversation.otherParticipant === 'string' 
                        ? conversation.otherParticipant 
                        : (conversation.otherParticipant._id?.toString() || conversation.otherParticipant._id);
                      if (otherId === firstTypingUserId) {
                        typingUser = conversation.otherParticipant;
                      }
                    }
                    
                    // Check participants if not found
                    if (!typingUser) {
                      typingUser = conversation.participants?.find((p: any) => {
                        const pId = typeof p === 'string' ? p : (p._id?.toString() || p._id);
                        return pId === firstTypingUserId;
                      });
                    }
                    
                    return (
                      <Avatar
                        src={typeof typingUser === 'object' ? typingUser.avatar_url : undefined}
                        icon={!typingUser?.avatar_url && <UserOutlined />}
                        size={32}
                      />
                    );
                  })()}
                </div>
                <div className={styles.typingIndicator}>
                  <div className={styles.typingBubble}>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          multiple
          style={{ display: 'none' }}
        />
        {selectedFiles.length > 0 && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#f8fafc', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            scrollbarWidth: 'thin'
          }}>
            {selectedFiles.map((fileItem, index) => (
              fileItem.preview ? (
                // Image preview
                <div key={index} style={{ position: 'relative', flexShrink: 0 }}>
                  <img 
                    src={fileItem.preview} 
                    alt="Preview" 
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }} 
                  />
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemoveFile(index)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#64748b',
                      color: 'white',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#64748b';
                    }}
                  />
                </div>
              ) : (
                // File preview
                <div key={index} style={{ 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  minWidth: '140px',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#137fec',
                    opacity: 0.1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <PaperClipOutlined style={{ fontSize: '20px', color: '#137fec' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {fileItem.file.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      {formatFileSize(fileItem.file.size)}
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemoveFile(index)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#64748b',
                      color: 'white',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#64748b';
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}
        <form
          className={styles.inputWrapper}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className={styles.inputContainer}>
            <Button
              type="text"
              icon={<PaperClipOutlined style={{ transform: 'rotate(45deg)' }} />}
              className={styles.inputButton}
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
            />
            <TextArea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Emit typing indicator
                if (!isTypingRef.current) {
                  isTypingRef.current = true;
                  emitChatEvent('typing', { conversationId: conversation._id, isTyping: true });
                }
                // Clear existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                // Set timeout to stop typing after 3 seconds of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                  if (isTypingRef.current) {
                    isTypingRef.current = false;
                    emitChatEvent('typing', { conversationId: conversation._id, isTyping: false });
                  }
                }, 3000);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              variant="borderless"
              style={{
                flex: 1,
                background: 'transparent',
                fontSize: '14px',
                padding: '12px 8px',
                maxHeight: '96px',
                resize: 'none',
              }}
            />
            <Button
              type="text"
              icon={<SmileOutlined />}
              className={styles.inputButton}
              aria-label="Insert emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            />
          </div>
          {showEmojiPicker && (
            <div style={{ 
              position: 'absolute', 
              bottom: '60px', 
              right: '16px', 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000
            }}>
              {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!inputValue.trim() && selectedFiles.length === 0}
            className={styles.sendButton}
            aria-label="Send message"
            htmlType="submit"
          />
        </form>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={!!imagePreview}
        onCancel={() => setImagePreview(null)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        centered
        styles={{ body: { padding: 0, textAlign: 'center' } }}
      >
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '90vh', 
              objectFit: 'contain' 
            }} 
          />
        )}
      </Modal>
    </Card>
  );
};

export default ChatPopup;

