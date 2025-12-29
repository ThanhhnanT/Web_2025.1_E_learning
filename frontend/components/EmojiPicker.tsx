import React from 'react';
import { Popover } from 'antd';
import { LikeOutlined, HeartOutlined, SmileOutlined, FrownOutlined, FireOutlined, MehOutlined } from '@ant-design/icons';

interface EmojiPickerProps {
  children: React.ReactNode;
  onSelect: (emoji: string) => void;
  currentReaction?: string;
}

const emojiOptions = [
  { emoji: 'like', label: 'Thích', icon: <LikeOutlined style={{ fontSize: 24, color: '#1877f2' }} /> },
  { emoji: 'love', label: 'Yêu thích', icon: <HeartOutlined style={{ fontSize: 24, color: '#f33e58' }} /> },
  { emoji: 'haha', label: 'Haha', icon: <SmileOutlined style={{ fontSize: 24, color: '#f7b125' }} /> },
  { emoji: 'wow', label: 'Wow', icon: <FireOutlined style={{ fontSize: 24, color: '#f7b125' }} /> },
  { emoji: 'sad', label: 'Buồn', icon: <FrownOutlined style={{ fontSize: 24, color: '#f7b125' }} /> },
  { emoji: 'angry', label: 'Phẫn nộ', icon: <MehOutlined style={{ fontSize: 24, color: '#e9710f' }} /> },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ children, onSelect, currentReaction }) => {
  const content = (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
      {emojiOptions.map((option) => (
        <div
          key={option.emoji}
          onClick={() => onSelect(option.emoji)}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 8,
            transition: 'all 0.2s',
            transform: currentReaction === option.emoji ? 'scale(1.1)' : 'scale(1)',
            background: currentReaction === option.emoji ? '#f0f2f5' : 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.2)';
            e.currentTarget.style.background = '#f0f2f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = currentReaction === option.emoji ? 'scale(1.1)' : 'scale(1)';
            e.currentTarget.style.background = currentReaction === option.emoji ? '#f0f2f5' : 'transparent';
          }}
          title={option.label}
        >
          {option.icon}
        </div>
      ))}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="top"
      overlayStyle={{ padding: 0 }}
    >
      {children}
    </Popover>
  );
};

export default EmojiPicker;

