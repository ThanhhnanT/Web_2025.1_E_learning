import React from 'react';
import { Modal, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Post, User, Comment } from '@/types/blog';
import LikeCommentSection from './LikeAndComment'; // Import component vừa tạo

interface PostDetailModalProps {
  post: Post | null;
  currentUser: User;
  open: boolean;
  onClose: () => void;
  onAddComment: (postId: string, content: string, imageFile?: File) => void;
  onReplyComment: (postId: string, parentCommentId: string, content: string, imageFile?: File) => void;
  onReactComment: (postId: string, commentId: string, emoji: string) => void;
  comments?: Comment[];
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ 
  post, 
  currentUser, 
  open, 
  onClose, 
  onAddComment,
  onReplyComment,
  onReactComment,
  comments = []
}) => {

  if (!post) return null;

  const postContentNode = (
    <div style={{ display: 'flex', marginBottom: 15 }}>
      <Avatar src={post.user.avatar} icon={<UserOutlined />} />
      <div style={{ marginLeft: 10, flex: 1 }}>
        <div style={{ fontWeight: 'bold' }}>
          {post.user.name} 
          <span style={{ color: 'gray', fontWeight: 'normal', fontSize: 12 }}>
             {' '}• {new Date(post.createdAt).toLocaleString('vi-VN')}
          </span>
        </div>
        <div style={{ marginTop: 5, whiteSpace: 'pre-wrap' }}>{post.content}</div>
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt="Post" 
            style={{ 
              marginTop: 10, 
              maxWidth: '100%', 
              borderRadius: 8, 
              border: '1px solid #f0f0f0' 
            }} 
          />
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      title="Chi tiết bài viết"
    >
      <LikeCommentSection
        comments={comments}
        currentUser={currentUser}
        onSubmit={(content, imageFile) => onAddComment(post.id, content, imageFile)}
        onReplyComment={(parentId, content, imageFile) => onReplyComment(post.id, parentId, content, imageFile)}
        onReactComment={(commentId, emoji) => onReactComment(post.id, commentId, emoji)}
        headerContent={postContentNode} 
      />
    </Modal>
  );
};

export default PostDetailModal;