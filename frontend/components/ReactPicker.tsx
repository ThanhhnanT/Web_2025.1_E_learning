import React, { useState } from 'react';
import { Popover } from 'antd';
import { LikeOutlined, HeartOutlined, SmileOutlined, FrownOutlined, ThunderboltOutlined, FireOutlined } from '@ant-design/icons';

interface ReactPickerProps {
  currentReactions: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }>;
  onReact: (emoji: string) => void;
  children: React.ReactNode;
}

const REACTIONS_CONFIG = [
  { emoji: 'like', Icon: LikeOutlined, label: 'Thích', color: '#1877f2' },
  { emoji: 'love', Icon: HeartOutlined, label: 'Yêu thích', color: '#f33e58' },
  { emoji: 'haha', Icon: SmileOutlined, label: 'Haha', color: '#f7b125' },
  { emoji: 'wow', Icon: ThunderboltOutlined, label: 'Wow', color: '#f7b125' },
  { emoji: 'sad', Icon: FrownOutlined, label: 'Buồn', color: '#f7b125' },
  { emoji: 'angry', Icon: FireOutlined, label: 'Phẫn nộ', color: '#e46a62' },
];

const ReactPicker: React.FC<ReactPickerProps> = ({ currentReactions, onReact, children }) => {
  const [open, setOpen] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setOpen(false);
  };

  // Get top 3 reactions
  const topReactions = Object.entries(currentReactions)
    .map(([emoji, data]) => ({
      emoji,
      count: data.count || 0,
      likedByCurrentUser: data.likedByCurrentUser || false,
    }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const totalReactions = Object.values(currentReactions).reduce(
    (sum, r) => sum + (r.count || 0),
    0
  );

  const content = (
    <div 
      style={{ 
        padding: '12px 12px', 
        minWidth: '300px',
        maxWidth: '320px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        marginBottom: topReactions.length > 0 ? 8 : 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}>
        {REACTIONS_CONFIG.map((reaction) => {
          const isActive = currentReactions[reaction.emoji]?.likedByCurrentUser || false;
          const IconComponent = reaction.Icon;
          return (
            <div
              key={reaction.emoji}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(reaction.emoji);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#e4e6eb' : 'transparent',
                transition: 'all 0.2s',
                transform: 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
                flex: '0 0 36px',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.backgroundColor = '#e4e6eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = isActive ? '#e4e6eb' : 'transparent';
              }}
              title={reaction.label}
            >
              <IconComponent style={{ fontSize: 22, color: reaction.color }} />
            </div>
          );
        })}
      </div>
      {topReactions.length > 0 && (
        <div style={{ borderTop: '1px solid #e4e6eb', paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#65676b', marginBottom: 4, fontWeight: 500 }}>
            Phản ứng nhiều nhất:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topReactions.map((reaction) => {
              const reactionConfig = REACTIONS_CONFIG.find(r => r.emoji === reaction.emoji);
              if (!reactionConfig) return null;
              const IconComponent = reactionConfig.Icon;
              return (
                <div
                  key={reaction.emoji}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 12,
                    backgroundColor: '#f0f2f5',
                    fontSize: 12,
                  }}
                >
                  <IconComponent style={{ fontSize: 14, color: reactionConfig.color }} />
                  <span style={{ fontWeight: 500 }}>{reaction.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="hover"
      open={open}
      onOpenChange={setOpen}
      placement="top"
      overlayStyle={{ 
        padding: 0, 
        zIndex: 1050,
        position: 'fixed',
      }}
      overlayInnerStyle={{ 
        padding: 0,
        overflow: 'hidden',
        borderRadius: '8px',
      }}
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.3}
      getPopupContainer={() => document.body}
      destroyTooltipOnHide
      autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}
      arrow={false}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
    </Popover>
  );
};

export default ReactPicker;

