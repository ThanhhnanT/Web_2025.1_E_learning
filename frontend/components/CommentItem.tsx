import React, { useState } from 'react';
import { Avatar, Button, Popover, Space } from 'antd'; 
import { UserOutlined, MessageOutlined, HeartOutlined, HeartFilled, LikeOutlined, SmileOutlined, FrownOutlined, FireOutlined, ThunderboltOutlined, UserAddOutlined } from '@ant-design/icons';
import { Comment, User } from '@/types/blog';
import ReactPicker from './ReactPicker';
import EmojiInput from './EmojiInput';
import FriendRequestPopup from './FriendRequestPopup';
import { checkFriendshipStatus } from '@/service/friends';
import { useRouter } from 'next/navigation';
import type { FriendshipStatus } from '@/service/friends';

interface CommentItemProps {
  comment: Comment;
  currentUser: User;
  onReply: (parentId: string, content: string, imageFile?: File) => void;
  onReact: (commentId: string, emoji: string) => void;
  isReply?: boolean; // Để biết đây là reply (cấp 2) hay comment gốc (cấp 1)
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUser, onReply, onReact, isReply = false }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showFriendRequestPopup, setShowFriendRequestPopup] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [loadingFriendship, setLoadingFriendship] = useState(false);
  const router = useRouter();

  const handleImageSelect = (file: File) => {
    setReplyImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReplyImage(null);
    setPreviewImage(null);
  };

  const handleSubmitReply = () => {
    if (!replyText.trim() && !replyImage) return;
    onReply(comment.id, replyText, replyImage || undefined);
    setReplyText('');
    setReplyImage(null);
    setPreviewImage(null);
    setIsReplying(false);
  };

  const reactions = comment.reactions || {};
  // Normalize reactions to consistent format
  const normalizedReactions: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }> = {};
  Object.entries(reactions).forEach(([emoji, data]: [string, any]) => {
    if (typeof data === 'number') {
      normalizedReactions[emoji] = { count: data, users: [], likedByCurrentUser: false };
    } else {
      normalizedReactions[emoji] = {
        count: data.count || 0,
        users: data.users || [],
        likedByCurrentUser: data.likedByCurrentUser || false,
      };
    }
  });
  
  const totalReactions = Object.values(normalizedReactions).reduce((sum, r) => sum + r.count, 0);
  
  // Get top 3 reactions sorted by count
  const topReactions = Object.entries(normalizedReactions)
    .map(([emoji, data]) => ({ emoji, ...data }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  const emojiIcons: Record<string, React.ReactNode> = {
    like: <LikeOutlined style={{ fontSize: 16, color: '#1877f2' }} />,
    love: <HeartFilled style={{ fontSize: 16, color: '#f33e58' }} />,
    haha: <SmileOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
    wow: <ThunderboltOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
    sad: <FrownOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
    angry: <FireOutlined style={{ fontSize: 16, color: '#e46a62' }} />,
  };
  
  const hasUserReaction = Object.values(normalizedReactions).some(r => r.likedByCurrentUser);
  
  // Check if comment user is current user
  const isCurrentUser = comment.user.id === currentUser.id;
  
  // Handle avatar/name click
  const handleUserClick = async (open: boolean) => {
    if (isCurrentUser) {
      if (open) {
        router.push('/auth/profile');
      }
      return;
    }
    
    if (open && !friendshipStatus) {
      try {
        setLoadingFriendship(true);
        const status = await checkFriendshipStatus(comment.user.id);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Error checking friendship status:', error);
      } finally {
        setLoadingFriendship(false);
      }
    }
  };

  const handleViewProfile = () => {
    router.push(`/auth/profile?userId=${comment.user.id}`);
  };

  const handleAddFriend = () => {
    if (friendshipStatus?.status === 'none') {
      setShowFriendRequestPopup(true);
    } else if (friendshipStatus?.status === 'pending' && !friendshipStatus.isSender) {
      setShowFriendRequestPopup(true);
    }
  };

  const getActionButton = () => {
    if (!friendshipStatus || isCurrentUser) return null;

    if (friendshipStatus.status === 'friends') {
      return null;
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

  const userMenuContent = (
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
        {!isCurrentUser && getActionButton() && (
          <div onClick={handleAddFriend} style={{ cursor: 'pointer' }}>
            {getActionButton()}
          </div>
        )}
      </Space>
    </div>
  );
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 15 }}>
      <div style={{ display: 'flex' }}>
        <Popover
          content={loadingFriendship ? <div style={{ padding: '8px' }}>Đang tải...</div> : userMenuContent}
          trigger="click"
          placement="bottomLeft"
          overlayStyle={{ padding: 0 }}
          onOpenChange={handleUserClick}
        >
          <Avatar 
            src={comment.user.avatar} 
            size="small" 
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Popover>
        
        <div style={{ marginLeft: 10, flex: 1 }}>
          <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: 12, display: 'inline-block' }}>
            <Popover
              content={loadingFriendship ? <div style={{ padding: '8px' }}>Đang tải...</div> : userMenuContent}
              trigger="click"
              placement="bottomLeft"
              overlayStyle={{ padding: 0 }}
              onOpenChange={handleUserClick}
            >
              <div 
                style={{ 
                  fontWeight: 'bold', 
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-block',
                  marginBottom: 4
                }}
              >
                {comment.user.name}
              </div>
            </Popover>
            <div style={{ fontSize: 14 }}>{comment.content}</div>
          </div>

          <div style={{ display: 'flex', gap: 15, marginLeft: 5, marginTop: 4, fontSize: 12, color: 'gray', alignItems: 'center' }}>
            <span>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
            
            {/* Reactions with ReactPicker */}
            <ReactPicker
              currentReactions={normalizedReactions}
              onReact={(emoji) => onReact(comment.id, emoji)}
            >
              <span
                style={{ 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: hasUserReaction ? '#1877f2' : '#65676b'
                }}
              >
                {totalReactions > 0 ? (
                  <>
                    {/* Show top 3 reactions */}
                    {topReactions.map((r, idx) => (
                      <span key={r.emoji} style={{ marginRight: idx < topReactions.length - 1 ? -4 : 0 }}>
                        {emojiIcons[r.emoji]}
                      </span>
                    ))}
                    <span>{totalReactions}</span>
                  </>
                ) : (
                  <>
                    <HeartOutlined />
                    <span>Thích</span>
                  </>
                )}
              </span>
            </ReactPicker>

            {/* Tất cả comments đều có nút "Trả lời" */}
            <span 
              style={{ cursor: 'pointer', fontWeight: 600, color: '#65676b' }}
              onClick={() => setIsReplying(!isReplying)}
            >
              Trả lời
            </span>

          </div>

          {isReplying && (
            <div style={{ marginTop: 10 }}>
              {previewImage && (
                <div style={{ position: 'relative', marginBottom: 8, display: 'inline-block' }}>
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8, border: '1px solid #ddd' }} 
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={handleRemoveImage}
                    style={{ position: 'absolute', top: 4, right: 4 }}
                  >
                    ×
                  </Button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={currentUser.avatar} size="small" />
                <div style={{ flex: 1 }}>
                  <EmojiInput
                    value={replyText}
                    onChange={setReplyText}
                    placeholder={`Trả lời ${comment.user.name}...`}
                    onImageSelect={handleImageSelect}
                    showImageUpload={true}
                    onPressEnter={handleSubmitReply}
                    autoFocus
                    suffix={
                      <MessageOutlined 
                        style={{ cursor: 'pointer', color: (replyText.trim() || replyImage) ? '#1890ff' : 'gray' }} 
                        onClick={handleSubmitReply}
                      />
                    }
                    style={{ borderRadius: 15, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render replies - tất cả replies đều đồng cấp (flat list) */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 45, marginTop: 10 }}>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onReact={onReact}
              isReply={true}
            />
          ))}
        </div>
      )}
      
      {/* Friend Request Popup */}
      {showFriendRequestPopup && !isCurrentUser && (
        <FriendRequestPopup
          userId={comment.user.id}
          userName={comment.user.name}
          avatarUrl={comment.user.avatar}
          friendshipStatus={friendshipStatus}
          onClose={() => setShowFriendRequestPopup(false)}
          onSuccess={() => {
            setShowFriendRequestPopup(false);
            // Refresh friendship status
            checkFriendshipStatus(comment.user.id).then(setFriendshipStatus);
          }}
        />
      )}
    </div>
  );
};

export default CommentItem;