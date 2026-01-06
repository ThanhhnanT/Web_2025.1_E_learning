"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, List, Input, Empty, Spin, message, Button, Space } from 'antd';
import { UserOutlined, SearchOutlined, MessageOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { getFriends, removeFriend, type Friend } from '@/service/friends';
import { createOrGetConversation, getConversationById, type Conversation } from '@/service/chats';
import ChatPopup from '@/components/ChatPopup';
import { getUserProfile } from '@/helper/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?._id) {
          setCurrentUserId(profile._id);
        }
        await loadFriends();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
      message.error('Không thể tải danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const conversation = await createOrGetConversation(friendId);
      
      // Fetch the conversation again to ensure we have the latest data with all participants
      // This helps avoid "not a participant" errors
      try {
        const refreshedConversation = await getConversationById(conversation._id);
        setSelectedConversation(refreshedConversation);
      } catch (refreshError) {
        // If refresh fails, use the original conversation
        console.warn('Failed to refresh conversation, using original:', refreshError);
        setSelectedConversation(conversation);
      }
      
      setShowChatPopup(true);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${friendName} khỏi danh sách bạn bè?`)) {
      return;
    }

    try {
      await removeFriend(friendId);
      message.success('Đã xóa bạn bè');
      await loadFriends();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa bạn bè');
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const name = friend.name?.toLowerCase() || '';
    return name.includes(searchText.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
          Bạn bè
        </h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Quản lý danh sách bạn bè của bạn
        </p>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm bạn bè..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : filteredFriends.length === 0 ? (
        <Card>
          <Empty
            description={searchText ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Card>
          <List
            dataSource={filteredFriends}
            renderItem={(friend) => (
              <List.Item
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={friend.avatar_url}
                      icon={!friend.avatar_url && <UserOutlined />}
                      size={48}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{friend.name}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        Bạn bè từ {formatDate(friend.friendsSince)}
                      </span>
                    </div>
                  }
                  description={friend.email}
                />
                <Space>
                  <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={() => handleStartChat(friend._id)}
                  >
                    Nhắn tin
                  </Button>
                  <Button
                    danger
                    icon={<UserDeleteOutlined />}
                    onClick={() => handleRemoveFriend(friend._id, friend.name)}
                  >
                    Xóa
                  </Button>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      {showChatPopup && selectedConversation && currentUserId && (
        <ChatPopup
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onClose={() => {
            setShowChatPopup(false);
            setSelectedConversation(null);
          }}
        />
      )}
    </div>
  );
}

