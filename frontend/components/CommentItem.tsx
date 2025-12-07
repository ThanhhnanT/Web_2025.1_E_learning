import React, { useState } from 'react';
import { Avatar, Input } from 'antd'; 
import { UserOutlined, MessageOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Comment, User } from '@/types/blog';

interface CommentItemProps {
  comment: Comment;
  currentUser: User;
  onReply: (parentId: string, content: string) => void;
  onReact: (commentId: string, emoji: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUser, onReply, onReact }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  const reactions = comment.reactions || {};
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const isLiked = comment.likedByCurrentUser || false;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 15 }}>
      <div style={{ display: 'flex' }}>
        <Avatar src={comment.user.avatar} size="small" icon={<UserOutlined />} />
        
        <div style={{ marginLeft: 10, flex: 1 }}>
          <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: 12, display: 'inline-block' }}>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>{comment.user.name}</div>
            <div style={{ fontSize: 14 }}>{comment.content}</div>
          </div>

          <div style={{ display: 'flex', gap: 15, marginLeft: 5, marginTop: 4, fontSize: 12, color: 'gray', alignItems: 'center' }}>
            <span>{comment.createdAt}</span>
            
            <span
              style={{ 
                cursor: 'pointer', 
                fontWeight: 600, 
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: isLiked ? '#ff4d4f' : '#65676b'
              }}
              onClick={() => onReact(comment.id, 'heart')}
            > 
              {isLiked ? <HeartFilled /> : <HeartOutlined />}
              {totalReactions>0 ? (
                <span>{totalReactions}</span>
              ):(
                <span>Thích</span>
              )}
            </span>

            <span 
              style={{ cursor: 'pointer', fontWeight: 600, color: '#65676b' }}
              onClick={() => setIsReplying(!isReplying)}
            >
              Trả lời
            </span>

          </div>

          {isReplying && (
            <div style={{ display: 'flex', marginTop: 10, alignItems: 'center' }}>
              <Avatar src={currentUser.avatar} size="small" style={{ marginRight: 8 }} />
              <Input 
                placeholder={`Trả lời ${comment.user.name}...`} 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onPressEnter={handleSubmitReply}
                style={{ borderRadius: 15, fontSize: 13 }}
                suffix={<MessageOutlined style={{ cursor: 'pointer' }} onClick={handleSubmitReply}/>}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ paddingLeft: 45 }}>
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              currentUser={currentUser}
              onReply={onReply}
              onReact={onReact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;