import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Upload, Avatar, message } from 'antd';
import { UserOutlined, PictureOutlined, CloseCircleFilled } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { User } from '@/types/blog';
import EmojiPicker from './EmojiPicker';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmit: (content: string, imageFile: File | null) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onClose, currentUser, onSubmit }) => {
  const [content, setContent] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setContent('');
      setPreviewImage(null);
      setFile(null);
    }
  }, [open]);

  const safeUser = currentUser || { name: 'Khách', avatar: '', id: 'guest' };

  const handleUpload = (file: RcFile) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Ảnh phải nhỏ hơn 2MB!');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setPreviewImage(reader.result as string);
    setFile(file);
    return false;
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setFile(null);
  };

  const handleSubmit = () => {
    if (!content.trim() && !file) {
      message.warning('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return;
    }
    onSubmit(content, file);
  };

  return (
    <Modal
      title={<div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Tạo bài viết</div>}
      open={open}
      onCancel={onClose}
      destroyOnHidden={true}
      maskClosable={false}
      footer={[
        <Button 
          key="submit" 
          type="primary" 
          block 
          size="large" 
          onClick={handleSubmit} 
          disabled={!content.trim() && !file}
          style={{ height: 40, fontWeight: 600 }}
        >
          Đăng
        </Button>,
      ]}
      width={500}
      centered 
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }} 
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
        <Avatar 
          src={safeUser.avatar} 
          icon={<UserOutlined />} 
          size="large" 
        />
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontWeight: 'bold', fontSize: 15 }}>{safeUser.name}</div>
          <div style={{ 
            fontSize: 12, 
            color: '#65676b', 
            background: '#E4E6EB', 
            padding: '2px 8px', 
            borderRadius: 6, 
            width: 'fit-content',
            marginTop: 2,
            fontWeight: 500
          }}>
             {safeUser.id === 'guest' ? 'Chế độ khách' : 'Công khai'}
          </div>
        </div>
      </div>

      <div style={{ minHeight: 120, position: 'relative' }}>
          <Input.TextArea
            placeholder={`Bạn đang nghĩ gì, ${safeUser.name}?`}
            autoSize={{ minRows: 4, maxRows: 10 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus={true}
            style={{ 
              fontSize: '20px',    
              lineHeight: '1.5',
              border: 'none',        
              marginBottom: 15,
              resize: 'none',      
              color: '#050505',     
              borderRadius: 0,
              paddingRight: 40
            }}
          />
          <div style={{ position: 'absolute', bottom: 20, right: 10 }}>
            <EmojiPicker
              onSelect={(emoji) => {
                const emojiMap: Record<string, string> = {
                  like: '👍',
                  love: '❤️',
                  haha: '😂',
                  wow: '😮',
                  sad: '😢',
                  angry: '😠',
                };
                setContent(content + (emojiMap[emoji] || emoji));
              }}
            >
              <Button
                type="text"
                icon={<span style={{ fontSize: 20 }}>😊</span>}
                style={{ padding: 0, width: 32, height: 32 }}
              />
            </EmojiPicker>
          </div>
      </div>

      {previewImage && (
        <div style={{ position: 'relative', marginBottom: 15, border: '1px solid #ddd', borderRadius: 8 }}>
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ width: '100%', borderRadius: 8, objectFit: 'cover', display: 'block' }} 
          />
          <div 
            onClick={handleRemoveImage}
            style={{ 
              position: 'absolute', top: 8, right: 8, 
              background: '#fff', borderRadius: '50%',
              cursor: 'pointer', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <CloseCircleFilled style={{ fontSize: 24, color: '#606770' }} />
          </div>
        </div>
      )}

      <div style={{ 
        border: '1px solid #dbdbdb', 
        borderRadius: 8, 
        padding: '10px 15px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <span style={{ fontWeight: 600, color: '#050505' }}>Thêm vào bài viết</span>
        <Upload 
          beforeUpload={handleUpload} 
          showUploadList={false} 
          accept="image/*"
        >
          <Tooltip title="Ảnh/Video">
            <Button 
              icon={<PictureOutlined style={{ color: '#45bd62', fontSize: 24 }} />} 
              type="text" 
              shape="circle" 
              style={{ width: 40, height: 40 }}
            />
          </Tooltip>
        </Upload>
      </div>
    </Modal>
  );
};
import { Tooltip } from 'antd'; 
export default CreatePostModal;