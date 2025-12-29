import React, { useState } from 'react';
import { Avatar, Input, Button, Divider, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { Comment, User } from '@/types/blog';
import CommentItem from './CommentItem';
import EmojiInput from './EmojiInput';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onReplyComment: (parentId: string, content: string, imageFile?: File) => void;
  onReactComment: (commentId: string, emoji: string) => void;
  onSubmit: (content: string, imageFile?: File) => void;
  headerContent?: React.ReactNode; 
}

const LikeCommentSection: React.FC<CommentSectionProps> = ({ 
  comments, 
  currentUser, 
  onReplyComment,
  onReactComment,
  onSubmit, 
  headerContent 
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    setCommentImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCommentImage(null);
    setPreviewImage(null);
  };

  const handleSubmit = () => {
    if (!commentText.trim() && !commentImage) return;
    onSubmit(commentText, commentImage || undefined);
    setCommentText('');
    setCommentImage(null);
    setPreviewImage(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 5, flex: 1 }}>
        
        {headerContent && (
          <>
            {headerContent}
            <Divider style={{ margin: '15px 0' }} />
          </>
        )}

        <h4 style={{ marginBottom: 15 }}>Bình luận</h4>
        {comments.length === 0 ? (
          <Empty 
            description="Chưa có bình luận nào. Hãy là người đầu tiên!" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onReply={onReplyComment} 
                onReact={onReactComment} 
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: 15, 
        paddingTop: 15, 
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff' 
      }}>
        {previewImage && (
          <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #ddd' }} 
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={currentUser.avatar} size="small" />
          <div style={{ flex: 1 }}>
            <EmojiInput
              value={commentText}
              onChange={setCommentText}
              placeholder={`Bình luận với tên ${currentUser.name}...`}
              onImageSelect={handleImageSelect}
              showImageUpload={true}
              onPressEnter={handleSubmit}
              suffix={
                <Button 
                  type="text" 
                  icon={<SendOutlined />} 
                  onClick={handleSubmit} 
                  disabled={!commentText.trim() && !commentImage}
                  style={{ color: (commentText.trim() || commentImage) ? '#1890ff' : 'gray' }}
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LikeCommentSection;