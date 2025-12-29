"use client";

import React, { useState, useEffect } from 'react';
import { Card, Avatar, List, Badge, Input, Empty, Spin, message } from 'antd';
import { UserOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import { getConversations, createOrGetConversation, type Conversation } from '@/service/chats';
import ChatPopup from '@/components/ChatPopup';
import { getUserProfile } from '@/helper/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showChatPopup, setShowChatPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const profile = await getUserProfile();
        if (profile?._id) {
          setCurrentUserId(profile._id);
        }

        // Load conversations
        await loadConversations();
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChatPopup(true);
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const conversation = await createOrGetConversation(friendId);
      setSelectedConversation(conversation);
      setShowChatPopup(true);
      await loadConversations();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.otherParticipant || conv.participants.find(
      (p) => p._id !== currentUserId
    );
    const name = otherParticipant?.name?.toLowerCase() || '';
    return name.includes(searchText.toLowerCase());
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return dayjs(dateString).fromNow();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
          Tin nhắn
        </h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Quản lý và trò chuyện với bạn bè của bạn
        </p>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <Empty
            description="Chưa có cuộc trò chuyện nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Card>
          <List
            dataSource={filteredConversations}
            renderItem={(conversation) => {
              const otherParticipant = conversation.otherParticipant || conversation.participants.find(
                (p) => p._id !== currentUserId
              );
              const unreadCount = conversation.unreadCount || 0;

              return (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onClick={() => handleConversationClick(conversation)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={unreadCount} offset={[-5, 5]}>
                        <Avatar
                          src={otherParticipant?.avatar_url}
                          icon={!otherParticipant?.avatar_url && <UserOutlined />}
                          size={48}
                        />
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{otherParticipant?.name || 'Unknown'}</span>
                        {conversation.lastMessageAt && (
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '4px',
                          }}
                        >
                          {conversation.lastMessage || 'Chưa có tin nhắn'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {showChatPopup && selectedConversation && (
        <ChatPopup
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onClose={() => {
            setShowChatPopup(false);
            setSelectedConversation(null);
            loadConversations(); // Refresh to update unread counts
          }}
        />
      )}
    </div>
  );
}

