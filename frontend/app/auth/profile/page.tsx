"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  Modal, 
  message, 
  Spin,
  Typography,
  Space,
  Divider,
  Slider
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  LockOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateProfile, uploadAvatar, changePassword } from '@/helper/api';
import { useMessageApi } from '@/components/providers/Message';
import Cookies from 'js-cookie';
import type { UploadFile, UploadProps } from 'antd';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import styles from '@/styles/profile.module.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const router = useRouter();
  const messageApi = useMessageApi();
  const bioValue = Form.useWatch('bio', form);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Image crop states
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const userData = await getUserProfile();
      if (userData) {
        setUser(userData);
        const formValues: any = {
          name: userData.name || '',
          phone: userData.phone || '',
        };
        // Only set bio if it has a value, otherwise leave it undefined to show placeholder
        if (userData.bio) {
          formValues.bio = userData.bio;
        }
        form.setFieldsValue(formValues);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error?.response?.status === 401) {
        messageApi.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        router.push('/auth/login');
      } else {
        messageApi.error('Không thể tải thông tin hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    const formValues: any = {
      name: user?.name || '',
      phone: user?.phone || '',
    };
    // Only set bio if it has a value, otherwise leave it undefined to show placeholder
    if (user?.bio) {
      formValues.bio = user.bio;
    }
    form.setFieldsValue(formValues);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const updatedUser = await updateProfile({
        name: values.name,
        phone: values.phone,
        bio: values.bio,
      });
      
      if (updatedUser) {
        setUser({ ...user, ...updatedUser });
        messageApi.success('Cập nhật thông tin thành công!');
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error?.response?.data?.message) {
        messageApi.error(error.response.data.message);
      } else {
        messageApi.error('Cập nhật thông tin thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error('Chỉ chấp nhận file ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error('Kích thước ảnh không được vượt quá 5MB!');
      return Upload.LIST_IGNORE;
    }
    
    // Open crop modal instead of uploading directly
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOriginalFile(file);
      setCropModalVisible(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    
    return Upload.LIST_IGNORE; // Prevent auto upload
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to crop area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to blob conversion failed'));
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels || !originalFile) {
      messageApi.error('Không thể xử lý ảnh. Vui lòng thử lại.');
      return;
    }

    setUploading(true);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (!croppedImage) {
        throw new Error('Failed to crop image');
      }

      const file = new File([croppedImage], originalFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const result = await uploadAvatar(file);
      
      if (result?.avatar_url) {
        setUser((prevUser) => ({
          ...prevUser,
          avatar_url: result.avatar_url,
        }));
        messageApi.success('Cập nhật ảnh đại diện thành công!');
        
        // Dispatch event to notify header to update avatar
        window.dispatchEvent(new CustomEvent('avatarUpdated', {
          detail: { avatar_url: result.avatar_url }
        }));
      } else {
        throw new Error('Upload failed: No avatar URL returned');
      }
    } catch (error: any) {
      console.error('Error uploading cropped avatar:', error);
      if (error?.response?.data?.message) {
        messageApi.error(error.response.data.message);
      } else if (error?.message) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Upload ảnh thất bại. Vui lòng thử lại.');
      }
    } finally {
      // Always reset states and close modal to prevent blocking
      setUploading(false);
      setCropModalVisible(false);
      setImageSrc('');
      setOriginalFile(null);
      setCroppedAreaPixels(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const handleCropCancel = () => {
    setCropModalVisible(false);
    setImageSrc('');
    setOriginalFile(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      
      if (values.newPassword !== values.confirmPassword) {
        messageApi.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
      }
      
      setChangingPassword(true);
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      
      messageApi.success('Đổi mật khẩu thành công!');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error?.response?.data?.message) {
        messageApi.error(error.response.data.message);
      } else {
        messageApi.error('Đổi mật khẩu thất bại. Vui lòng thử lại.');
      }
    } finally {
      setChangingPassword(false);
      // Ensure modal can be closed even if there's an error
      if (!passwordModalVisible) {
        passwordForm.resetFields();
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.profileCard}>
        {/* Header Section with Avatar */}
        <div className={styles.headerSection}>
          <div className={styles.avatarSection}>
            <Upload
              beforeUpload={beforeUpload}
              showUploadList={false}
              accept="image/*"
            >
              <div className={styles.avatarWrapper}>
                <Avatar
                  size={120}
                  src={user?.avatar_url}
                  icon={!user?.avatar_url && <UserOutlined />}
                  className={styles.avatar}
                />
                <div className={styles.avatarOverlay}>
                  <CameraOutlined className={styles.cameraIcon} />
                </div>
              </div>
            </Upload>
            {uploading && (
              <div className={styles.uploadingIndicator}>
                <Spin size="small" />
              </div>
            )}
          </div>
          
          <div className={styles.userInfo}>
            <Title level={2} className={styles.userName}>
              {user?.name || 'Chưa có tên'}
            </Title>
            <Text type="secondary" className={styles.userEmail}>
              <MailOutlined /> {user?.email || 'Chưa có email'}
            </Text>
          </div>
          
          <div className={styles.actionButtons}>
            {!isEditing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                size="large"
              >
                Chỉnh sửa
              </Button>
            ) : (
              <Space>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  size="large"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  size="large"
                >
                  Lưu
                </Button>
              </Space>
            )}
          </div>
        </div>

        <Divider />

        {/* Profile Information Form */}
        <Form
          form={form}
          layout="vertical"
          className={styles.profileForm}
        >
          <Form.Item
            label={
              <span>
                <UserOutlined /> Họ và tên
              </span>
            }
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên!' },
              { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
            ]}
          >
            <Input
              size="large"
              disabled={!isEditing}
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <MailOutlined /> Email
              </span>
            }
          >
            <Input
              size="large"
              value={user?.email || ''}
              disabled
              prefix={<MailOutlined />}
            />
            <Text type="secondary" className={styles.helperText}>
              Email không thể thay đổi
            </Text>
          </Form.Item>

          <Form.Item
            label={
              <span>
                <PhoneOutlined /> Số điện thoại
              </span>
            }
            name="phone"
            rules={[
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
            ]}
          >
            <Input
              size="large"
              disabled={!isEditing}
              placeholder="Nhập số điện thoại"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <FileTextOutlined /> Giới thiệu
              </span>
            }
            name="bio"
            rules={[
              { max: 500, message: 'Giới thiệu không được vượt quá 500 ký tự!' },
            ]}
          >
            <div style={{ position: 'relative' }}>
              <TextArea
                rows={4}
                disabled={!isEditing}
                placeholder={isEditing ? "Viết giới thiệu về bản thân..." : undefined}
                maxLength={500}
                showCount
                allowClear
                style={{
                  color: !isEditing && !bioValue ? 'transparent' : undefined,
                  borderRadius: '16px',
                }}
              />
              {!isEditing && !bioValue && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '11px',
                    color: '#bfbfbf',
                    pointerEvents: 'none',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  Viết giới thiệu về bản thân...
                </div>
              )}
            </div>
          </Form.Item>
        </Form>

        <Divider />

        {/* Password Change Section */}
        <div className={styles.passwordSection}>
          <Button
            type="default"
            icon={<LockOutlined />}
            onClick={() => setPasswordModalVisible(true)}
            size="large"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        title="Đổi mật khẩu"
        open={passwordModalVisible}
        onCancel={() => {
          if (!changingPassword) {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }
        }}
        onOk={handleChangePassword}
        confirmLoading={changingPassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
        maskClosable={false}
        keyboard={false}
        closable={!changingPassword}
        cancelButtonProps={{ disabled: changingPassword }}
        destroyOnClose={true}
        centered
        wrapClassName={styles.passwordModal}
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu cũ!' },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Nhập mật khẩu cũ"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Crop Modal */}
      {cropModalVisible && (
        <Modal
          title="Chỉnh sửa ảnh đại diện"
          open={cropModalVisible}
          onCancel={handleCropCancel}
          onOk={handleCropComplete}
          okText="Lưu ảnh"
          cancelText="Hủy"
          width={600}
          confirmLoading={uploading}
          maskClosable={false}
          keyboard={false}
          closable={!uploading}
          cancelButtonProps={{ disabled: uploading }}
          destroyOnClose={true}
          afterClose={() => {
            // Cleanup when modal is fully closed
            setImageSrc('');
            setOriginalFile(null);
            setCroppedAreaPixels(null);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
          }}
        >
        <div className={styles.cropContainer}>
          <div className={styles.cropWrapper}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </div>
          <div className={styles.cropControls}>
            <ZoomOutOutlined />
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(value) => setZoom(value)}
              style={{ width: '100%', margin: '0 16px' }}
            />
            <ZoomInOutlined />
          </div>
          <div className={styles.cropHint}>
            <Text type="secondary">
              Kéo để di chuyển ảnh, điều chỉnh thanh trượt để phóng to/thu nhỏ
            </Text>
          </div>
        </div>
        </Modal>
      )}
    </div>
  );
}

