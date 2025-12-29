"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Input, Button, message } from 'antd';
import { UserOutlined, SendOutlined, CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { createMessage, getMessages, markMessagesAsRead, type Message, type Conversation } from '@/service/chats';
import { connectChatSocket, disconnectChatSocket, onChatEvent, offChatEvent, emitChatEvent } from '@/lib/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { TextArea } = Input;

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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketConnectedRef = useRef(false);

  const otherParticipant = conversation.otherParticipant || conversation.participants.find(
    (p) => p._id !== currentUserId
  );

  useEffect(() => {
    // Connect to chat socket
    if (!socketConnectedRef.current) {
      connectChatSocket();
      socketConnectedRef.current = true;
    }

    // Join conversation room
    emitChatEvent('join:conversation', conversation._id);

    // Load messages
    loadMessages();

    // Listen for new messages
    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.conversationId === conversation._id) {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        
        // Mark as read if message is from other participant
        if (newMessage.senderId._id !== currentUserId) {
          markMessagesAsRead(conversation._id).catch(console.error);
        }
      }
    };

    onChatEvent('message:new', handleNewMessage);

    // Mark messages as read when opening
    markMessagesAsRead(conversation._id).catch(console.error);

    return () => {
      offChatEvent('message:new', handleNewMessage);
      emitChatEvent('leave:conversation', conversation._id);
    };
  }, [conversation._id, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const loadedMessages = await getMessages(conversation._id, 1, 50);
      setMessages(loadedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      message.error('Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    try {
      setSending(true);
      const newMessage = await createMessage(conversation._id, inputValue.trim());
      setMessages((prev) => [...prev, newMessage]);
      setInputValue('');
      scrollToBottom();
    } catch (error: any) {
      console.error('Error sending message:', error);
      message.error(error?.response?.data?.message || 'Gửi tin nhắn thất bại');
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
    <div
      className="fixed bottom-0 right-4 sm:bottom-6 sm:right-8 z-50 w-full sm:w-[380px] flex flex-col h-[600px] max-h-[85vh] bg-white dark:bg-[#1e293b] rounded-t-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      style={{
        fontFamily: 'Lexend, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={otherParticipant?.avatar_url}
              icon={!otherParticipant?.avatar_url && <UserOutlined />}
              size={40}
              style={{ border: '2px solid #e5e7eb' }}
            />
            <span
              className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#1e293b]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-slate-900 dark:text-white text-sm font-semibold leading-tight m-0">
              {otherParticipant?.name || 'Unknown'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-tight m-0">
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button
              type="text"
              icon={<MinusOutlined />}
              onClick={onMinimize}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            />
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="text-slate-400 hover:text-red-500"
          />
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-5 bg-background-light dark:bg-[#0f172a]"
        style={{
          backgroundColor: '#f6f7f8',
          scrollbarWidth: 'thin',
        }}
      >
        {loading ? (
          <div className="text-center text-slate-400">Đang tải...</div>
        ) : groupedMessages.length === 0 ? (
          <div className="text-center text-slate-400">Chưa có tin nhắn nào</div>
        ) : (
          groupedMessages.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className="flex justify-center">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-full uppercase tracking-wide">
                    {item.date}
                  </span>
                </div>
              );
            }

            const message = item as Message;
            const isOwnMessage = message.senderId._id === currentUserId;
            const showAvatar = !isOwnMessage && (
              index === 0 ||
              groupedMessages[index - 1]?.type === 'date' ||
              (groupedMessages[index - 1] as Message)?.senderId._id !== message.senderId._id
            );

            return (
              <div
                key={message._id}
                className={`flex items-end gap-2.5 ${isOwnMessage ? 'justify-end' : ''}`}
              >
                {!isOwnMessage && (
                  <Avatar
                    src={message.senderId.avatar_url}
                    icon={!message.senderId.avatar_url && <UserOutlined />}
                    size={32}
                    style={{ display: showAvatar ? 'block' : 'none', marginBottom: '4px' }}
                  />
                )}
                <div
                  className={`flex flex-col gap-1 max-w-[75%] ${isOwnMessage ? 'items-end' : ''}`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-sm ${
                      isOwnMessage
                        ? 'bg-[#137fec] text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-700 rounded-bl-none border border-slate-100 dark:border-slate-600'
                    }`}
                  >
                    <p
                      className={`text-sm font-normal leading-relaxed m-0 ${
                        isOwnMessage
                          ? 'text-white'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-[#1e293b] px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 pr-2 border border-transparent focus-within:border-[#137fec]/50 focus-within:ring-2 focus-within:ring-[#137fec]/10 transition-all">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 resize-none"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!inputValue.trim()}
            className="bg-[#137fec] hover:bg-blue-600 border-none"
            style={{ minWidth: '40px', height: '40px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPopup;

