import React, { useState } from 'react';
import { Popover, Button } from 'antd';
import { SmileOutlined, PictureOutlined } from '@ant-design/icons';
import EmojiPicker from './EmojiPicker';

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageSelect?: (file: File) => void;
  showImageUpload?: boolean;
  autoFocus?: boolean;
  onPressEnter?: () => void;
  suffix?: React.ReactNode;
  style?: React.CSSProperties;
}

const EmojiInput: React.FC<EmojiInputProps> = ({
  value,
  onChange,
  placeholder,
  onImageSelect,
  showImageUpload = false,
  autoFocus = false,
  onPressEnter,
  suffix,
  style,
}) => {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    // Convert emoji name to actual emoji
    const emojiMap: Record<string, string> = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠',
    };
    const actualEmoji = emojiMap[emoji] || emoji;
    onChange(value + actualEmoji);
    setEmojiPickerOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      onImageSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && onPressEnter) {
            onPressEnter();
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          padding: '8px 12px',
          paddingRight: showImageUpload ? '80px' : '40px',
          border: '1px solid #ddd',
          borderRadius: 20,
          fontSize: 14,
          outline: 'none',
          ...style,
        }}
      />
      <div style={{ position: 'absolute', right: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
        <EmojiPicker onSelect={handleEmojiSelect}>
          <Button
            type="text"
            icon={<SmileOutlined style={{ color: '#65676b' }} />}
            style={{ padding: 0, width: 32, height: 32 }}
          />
        </EmojiPicker>
        {showImageUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <Button
              type="text"
              icon={<PictureOutlined style={{ color: '#65676b' }} />}
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: 0, width: 32, height: 32 }}
            />
          </>
        )}
        {suffix}
      </div>
    </div>
  );
};

export default EmojiInput;

