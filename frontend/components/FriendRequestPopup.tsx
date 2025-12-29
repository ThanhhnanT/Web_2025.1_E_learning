"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Avatar, Input, Button, message, Space, Typography } from 'antd';
import { UserOutlined, SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriendRequests } from '@/service/friends';
import type { FriendshipStatus } from '@/service/friends';

const { TextArea } = Input;
const { Text } = Typography;

interface FriendRequestPopupProps {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  friendshipStatus?: FriendshipStatus | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FriendRequestPopup: React.FC<FriendRequestPopupProps> = ({
  userId,
  userName = 'User',
  avatarUrl,
  friendshipStatus,
  onClose,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    const fetchPendingRequest = async () => {
      if (friendshipStatus?.status === 'pending' && !friendshipStatus.isSender) {
        try {
          const requests = await getFriendRequests();
          const request = requests.find(
            (r) => r.senderId._id === userId || r.receiverId._id === userId,
          );
          if (request) {
            setPendingRequest(request);
            setNote(request.note || '');
          }
        } catch (error) {
          console.error('Error fetching pending request:', error);
        }
      }
    };

    fetchPendingRequest();
  }, [friendshipStatus, userId]);

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      await sendFriendRequest(userId, note);
      message.success('Đã gửi lời mời kết bạn');
      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Gửi lời mời thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingRequest) return;
    try {
      setLoading(true);
      await acceptFriendRequest(pendingRequest._id);
      message.success('Đã chấp nhận lời mời kết bạn');
      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Chấp nhận thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    try {
      setLoading(true);
      await rejectFriendRequest(pendingRequest._id);
      message.success('Đã từ chối lời mời kết bạn');
      onSuccess();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setLoading(false);
    }
  };

  const isPendingReceived = friendshipStatus?.status === 'pending' && !friendshipStatus.isSender;

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      styles={{
        body: { padding: '24px' },
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 600, margin: 0, marginBottom: '16px' }}>
            {isPendingReceived ? 'Lời mời kết bạn' : 'Gửi lời mời kết bạn'}
          </h3>
        </div>

        {/* Profile Preview */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <Avatar
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              size={96}
              style={{ border: '4px solid #137fec', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#52c41a',
                border: '4px solid white',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '20px' }}>
                {userName}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Student
            </Text>
          </div>
        </div>

        {/* Explainer Text */}
        {!isPendingReceived && (
          <div style={{ marginBottom: '24px' }}>
            <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Thêm {userName} làm bạn sẽ cho phép bạn chia sẻ ghi chú và cộng tác trong các dự án. Bạn có muốn tiếp tục?
            </Text>
          </div>
        )}

        {/* Note Input (for sending request) */}
        {!isPendingReceived && (
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '14px' }}>
                Thêm ghi chú cá nhân (tùy chọn)
              </Text>
            </div>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Xin chào ${userName}, tôi muốn kết nối và thảo luận về dự án...`}
              rows={4}
              style={{ borderRadius: '8px' }}
            />
          </div>
        )}

        {/* Pending Request Note (for received request) */}
        {isPendingReceived && pendingRequest?.note && (
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
              "{pendingRequest.note}"
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
          {isPendingReceived ? (
            <>
              <Button
                size="large"
                onClick={onClose}
                style={{ minWidth: '120px' }}
              >
                Hủy
              </Button>
              <Button
                type="default"
                size="large"
                icon={<CloseOutlined />}
                onClick={handleReject}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handleAccept}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                Chấp nhận
              </Button>
            </>
          ) : (
            <>
              <Button
                size="large"
                onClick={onClose}
                style={{ minWidth: '120px' }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSendRequest}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                Gửi lời mời
              </Button>
            </>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default FriendRequestPopup;

