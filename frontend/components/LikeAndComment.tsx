import React, { useState } from 'react';
import { Avatar, Input, Button, Divider, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { Comment, User } from '@/types/blog';
import CommentItem from './CommentItem'; // Đảm bảo đã có file này từ bước trước

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onReplyComment: (parentId: string, content: string) => void;
  onReactComment: (commentId: string, emoji: string) => void;
  onSubmit: (content: string) => void;
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

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    onSubmit(commentText);
    setCommentText(''); 
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
        display: 'flex', 
        marginTop: 15, 
        paddingTop: 15, 
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff' 
      }}>
        <Avatar src={currentUser.avatar} size="small" style={{ marginRight: 10 }} />
        <Input
          placeholder={`Bình luận với tên ${currentUser.name}...`}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onPressEnter={handleSubmit}
          suffix={
            <Button 
              type="text" 
              icon={<SendOutlined />} 
              onClick={handleSubmit} 
              disabled={!commentText.trim()}
              style={{ color: commentText.trim() ? '#1890ff' : 'gray' }}
            />
          }
        />
      </div>
    </div>
  );
};

export default LikeCommentSection;