"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Popover, Button, Space } from 'antd';
import { UserOutlined, UserAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import FriendRequestPopup from './FriendRequestPopup';
import { checkFriendshipStatus } from '@/service/friends';
import type { FriendshipStatus } from '@/service/friends';

interface AvatarHoverProps {
  userId: string;
  avatarUrl?: string;
  name?: string;
  size?: number;
  className?: string;
}

const AvatarHover: React.FC<AvatarHoverProps> = ({
  userId,
  avatarUrl,
  name,
  size = 40,
  className,
}) => {
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [showFriendRequestPopup, setShowFriendRequestPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFriendshipStatus = async () => {
      try {
        setLoading(true);
        const status = await checkFriendshipStatus(userId);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Error checking friendship status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFriendshipStatus();
    }
  }, [userId]);

  const handleViewProfile = () => {
    router.push(`/auth/profile?userId=${userId}`);
  };

  const handleAddFriend = () => {
    if (friendshipStatus?.status === 'none') {
      setShowFriendRequestPopup(true);
    } else if (friendshipStatus?.status === 'pending' && !friendshipStatus.isSender) {
      // If there's a pending request from them, show accept/reject options
      setShowFriendRequestPopup(true);
    }
  };

  const getActionButton = () => {
    if (!friendshipStatus) return null;

    if (friendshipStatus.status === 'friends') {
      return null; // Already friends, no action needed
    }

    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.isSender) {
        return (
          <Button type="default" size="small" disabled>
            Đã gửi lời mời
          </Button>
        );
      } else {
        return (
          <Button type="primary" size="small" onClick={handleAddFriend}>
            Xem lời mời
          </Button>
        );
      }
    }

    return (
      <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={handleAddFriend}>
        Kết bạn
      </Button>
    );
  };

  const content = (
    <div style={{ minWidth: 200, padding: '8px 0' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Button
          type="text"
          block
          icon={<UserOutlined />}
          onClick={handleViewProfile}
          style={{ textAlign: 'left' }}
        >
          Xem hồ sơ
        </Button>
        {getActionButton() && (
          <div onClick={handleAddFriend} style={{ cursor: 'pointer' }}>
            {getActionButton()}
          </div>
        )}
      </Space>
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        trigger="hover"
        placement="bottom"
        overlayStyle={{ padding: 0 }}
      >
        <Avatar
          src={avatarUrl}
          icon={!avatarUrl && <UserOutlined />}
          size={size}
          className={className}
          style={{ cursor: 'pointer' }}
        />
      </Popover>

      {showFriendRequestPopup && (
        <FriendRequestPopup
          userId={userId}
          userName={name}
          avatarUrl={avatarUrl}
          friendshipStatus={friendshipStatus}
          onClose={() => setShowFriendRequestPopup(false)}
          onSuccess={() => {
            setShowFriendRequestPopup(false);
            // Refresh friendship status
            checkFriendshipStatus(userId).then(setFriendshipStatus);
          }}
        />
      )}
    </>
  );
};

export default AvatarHover;

