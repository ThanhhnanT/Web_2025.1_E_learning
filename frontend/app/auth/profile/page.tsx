"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Slider,
  Tabs,
  Badge,
  Tag,
  Empty,
  Switch,
  Row,
  Col,
  Statistic
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
  ZoomOutOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  LinkOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  UserAddOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  FireOutlined,
  StarOutlined,
  HeartOutlined,
  CommentOutlined,
  ThunderboltOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserProfile, updateProfile, uploadAvatar, changePassword } from '@/helper/api';
import { getUserById } from '@/service/users';
import { getFriends, getUserFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest, checkFriendshipStatus, sendFriendRequest, removeFriend } from '@/service/friends';
import { getUserStatistics } from '@/service/statistics';
import { getPosts } from '@/service/posts';
import StatisticsOverview from '@/app/statistics/components/StatisticsOverview';
import TestStatistics from '@/app/statistics/components/TestStatistics';
import CourseStatistics from '@/app/statistics/components/CourseStatistics';
import FlashcardStatistics from '@/app/statistics/components/FlashcardStatistics';
import { useMessageApi } from '@/components/providers/Message';
import Cookies from 'js-cookie';
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
  location?: string;
  website?: string;
  createdAt?: string;
}

interface Friend {
  _id: string;
  name: string;
  email: string;
  avatar_url?: string;
  friendsSince: string;
}

interface FriendRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  status: string;
  createdAt: string;
}

type TabKey = 'overview' | 'blog' | 'friends' | 'settings'

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageApi = useMessageApi();
  const bioValue = Form.useWatch('bio', form);
  
  const userId = searchParams.get('userId');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Check if viewing own profile: no userId param OR userId matches current user
  const isOwnProfile = !userId || (currentUserId !== null && currentUserId === userId);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
  // Friends data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<any>(null);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendSearchText, setFriendSearchText] = useState('');
  
  // Statistics and blog data
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(false);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showOverview: true,
    showBlog: true,
    showFriends: true,
  });
  
  // Statistics (mock data for now, can be replaced with real API)
  const [stats, setStats] = useState({
    coursesCompleted: 12,
    badgesEarned: 8,
    friendsCount: 145,
    mutualFriends: 12,
    dayStreak: 45,
    followers: 89,
    rank: 'Top 5%'
  });
  
  // Image crop states
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUserProfile();
    // Always fetch current user ID first to determine if it's own profile
    fetchCurrentUserId();
  }, [userId]);

  useEffect(() => {
    // After currentUserId is set, determine what to fetch
    if (currentUserId !== null) {
      const viewingOwnProfile = !userId || currentUserId === userId;
      
      if (viewingOwnProfile) {
        fetchFriendRequests();
        fetchFriends();
        fetchStatistics();
        fetchBlogPosts();
      } else {
        // When viewing other user's profile, wait for user data to load privacy settings
        // This will be handled in a separate effect after user data is loaded
      }
    }
  }, [currentUserId, userId]);

  // Separate effect to fetch data for other user's profile after privacy settings are loaded
  useEffect(() => {
    if (currentUserId !== null && userId && currentUserId !== userId && user) {
      // When viewing other user's profile, check friendship status
      checkFriendship();
      // Also fetch friend requests to check if there's a pending request from them
      fetchFriendRequests();
      // Fetch friends of the viewed user (if allowed)
      if (privacySettings.showFriends) {
        fetchFriends();
      }
      // Fetch statistics (if allowed)
      if (privacySettings.showOverview) {
        fetchStatistics();
      }
      // Fetch blog posts (if allowed)
      if (privacySettings.showBlog) {
        fetchBlogPosts();
      }
    }
  }, [user, privacySettings, currentUserId, userId]);

  const fetchCurrentUserId = async () => {
    try {
      const currentUser = await getUserProfile();
      if (currentUser?._id) {
        console.log('Current user ID:', currentUser._id);
        console.log('Viewing userId:', userId);
        console.log('Is own profile:', !userId || currentUser._id === userId);
        setCurrentUserId(currentUser._id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      let userData;
      if (userId) {
        // Fetch other user's profile
        userData = await getUserById(userId);
      } else {
        // Fetch own profile
        userData = await getUserProfile();
      }
      
      if (userData) {
        setUser(userData);
        // Set privacy settings from user data
        if (userData.showOverview !== undefined) {
          setPrivacySettings({
            showOverview: userData.showOverview ?? true,
            showBlog: userData.showBlog ?? true,
            showFriends: userData.showFriends ?? true,
          });
        }
        const formValues: any = {
          name: userData.name || '',
          phone: userData.phone || '',
        };
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

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      let friendsData: Friend[] = [];
      if (isOwnProfile) {
        // Fetch current user's friends
        friendsData = await getFriends();
      } else if (userId) {
        // Fetch viewed user's friends
        friendsData = await getUserFriends(userId);
      }
      setFriends(friendsData || []);
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      // Set empty array on error to prevent UI issues
      setFriends([]);
      if (error?.response?.status !== 404) {
        messageApi.error('Không thể tải danh sách bạn bè');
      }
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests || []);
    } catch (error: any) {
      console.error('Error fetching friend requests:', error);
      // Set empty array on error
      setFriendRequests([]);
      // Don't show error for 404 as it might mean no requests
      if (error?.response?.status && error.response.status !== 404) {
        messageApi.error('Không thể tải lời mời kết bạn');
      }
    }
  };

  const fetchStatistics = async () => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return;
    
    try {
      setLoadingStatistics(true);
      const statsData = await getUserStatistics(targetUserId);
      setStatistics(statsData);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      // Don't show error if it's 404 (user doesn't allow viewing) or 403 (forbidden)
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        // User doesn't allow viewing statistics or doesn't exist
        setStatistics(null);
      } else if (error?.response?.status !== 401) {
        // Only show error if it's not 401 (unauthorized) or 404/403
        messageApi.error('Không thể tải thống kê');
      }
    } finally {
      setLoadingStatistics(false);
    }
  };

  const fetchBlogPosts = async () => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return;
    
    try {
      setLoadingBlog(true);
      const response = await getPosts({ page: 1, limit: 20 });
      // Filter posts by user ID
      const userPosts = response.data.filter((post: any) => {
        const postUserId = post.user?.id || post.user?._id?.toString();
        return postUserId === targetUserId;
      });
      setBlogPosts(userPosts);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      if (error?.response?.status !== 404) {
        messageApi.error('Không thể tải bài viết');
      }
    } finally {
      setLoadingBlog(false);
    }
  };

  const handlePrivacyChange = async (key: 'showOverview' | 'showBlog' | 'showFriends', value: boolean) => {
    try {
      // Update on backend first
      const updatedUser = await updateProfile({ [key]: value });
      
      // Update local state
      const newSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(newSettings);
      
      // Update user data if returned
      if (updatedUser) {
        setUser({ ...user, ...updatedUser });
        // Update privacy settings from response
        if (updatedUser.showOverview !== undefined) {
          setPrivacySettings({
            showOverview: updatedUser.showOverview ?? true,
            showBlog: updatedUser.showBlog ?? true,
            showFriends: updatedUser.showFriends ?? true,
          });
        }
      }
      
      messageApi.success('Đã cập nhật cài đặt quyền riêng tư');
    } catch (error: any) {
      console.error('Error updating privacy settings:', error);
      messageApi.error('Không thể cập nhật cài đặt');
      // Revert on error
      setPrivacySettings(privacySettings);
    }
  };

  const checkFriendship = async () => {
    if (!userId) return;
    try {
      console.log('Checking friendship status for userId:', userId);
      const status = await checkFriendshipStatus(userId);
      console.log('Friendship status received:', JSON.stringify(status, null, 2));
      console.log('isSender value:', status?.isSender);
      console.log('status value:', status?.status);
      setFriendshipStatus(status);
    } catch (error: any) {
      console.error('Error checking friendship:', error);
      // If endpoint doesn't exist or returns 404, set default status
      if (error?.response?.status === 404) {
        setFriendshipStatus({ status: 'none' });
      } else {
        // Set default status on error
        setFriendshipStatus({ status: 'none' });
      }
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

  const handleAddFriend = async () => {
    if (!userId) return;
    try {
      console.log('Sending friend request to userId:', userId);
      const result = await sendFriendRequest(userId);
      console.log('Friend request sent successfully:', result);
      messageApi.success('Đã gửi lời mời kết bạn!');
      // Refresh friendship status to update UI
      await checkFriendship();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      console.error('Error response:', error?.response);
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.';
      messageApi.error(errorMessage);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    if (!requestId) {
      messageApi.error('Không tìm thấy ID lời mời kết bạn');
      return;
    }
    try {
      // Get current user ID to verify
      const currentUser = await getUserProfile();
      const currentUserId = currentUser?._id;
      console.log('Accepting friend request:', {
        requestId,
        currentUserId,
      });
      
      const result = await acceptFriendRequest(requestId);
      console.log('Friend request accepted successfully:', result);
      messageApi.success('Đã chấp nhận lời mời kết bạn!');
      // Refresh data
      await Promise.all([
        fetchFriendRequests(),
        fetchFriends()
      ]);
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.';
      messageApi.error(errorMessage);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      messageApi.success('Đã từ chối lời mời kết bạn');
      fetchFriendRequests();
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || 'Không thể từ chối lời mời');
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;
    try {
      await removeFriend(userId);
      messageApi.success('Đã hủy kết bạn');
      // Refresh friendship status
      await checkFriendship();
      // Refresh friends list if viewing own profile
      if (isOwnProfile) {
        await fetchFriends();
      }
    } catch (error: any) {
      console.error('Error removing friend:', error);
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || 'Không thể hủy kết bạn. Vui lòng thử lại sau.';
      messageApi.error(errorMessage);
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
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOriginalFile(file);
      setCropModalVisible(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    
    return Upload.LIST_IGNORE;
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

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

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
      if (!passwordModalVisible) {
        passwordForm.resetFields();
      }
    }
  };

  const filteredFriends = useMemo(() => {
    if (!friendSearchText) return friends;
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(friendSearchText.toLowerCase()) ||
      friend.email.toLowerCase().includes(friendSearchText.toLowerCase())
    );
  }, [friends, friendSearchText]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Wrapper component for TestStatistics to pass userId
  const TestStatisticsWithUserId = ({ testStats, userId }: { testStats: any; userId: string }) => {
    return <TestStatistics testStats={testStats} userId={userId} />;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  // Build tab items based on privacy settings
  const tabItems = [];
  
  // Overview tab - only show if own profile or privacy allows
  if (isOwnProfile || privacySettings.showOverview) {
    tabItems.push({
      key: 'overview',
      label: 'Tổng quan',
      children: (
        <div style={{ padding: '24px 0' }}>
          {loadingStatistics ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin />
            </div>
          ) : statistics ? (
            <div>
              {statistics.overview && (
                <StatisticsOverview overview={statistics.overview} />
              )}
              {statistics.testStats && (
                <TestStatisticsWithUserId 
                  testStats={statistics.testStats} 
                  userId={userId || currentUserId || ''} 
                />
              )}
              {statistics.courseStats && (
                <CourseStatistics courseStats={statistics.courseStats} />
              )}
              {statistics.flashcardStats && (
                <FlashcardStatistics flashcardStats={statistics.flashcardStats} />
              )}
            </div>
          ) : (
            <Empty description="Chưa có thống kê" />
          )}
        </div>
      )
    });
  }
  
  // Blog tab - only show if own profile or privacy allows
  if (isOwnProfile || privacySettings.showBlog) {
    tabItems.push({
      key: 'blog',
      label: 'Blog',
      children: (
        <div>
          {loadingBlog ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin />
            </div>
          ) : blogPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {blogPosts.map((post: any) => (
                <Card key={post.id} hoverable style={{ borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Avatar src={post.user?.avatar_url} icon={<UserOutlined />} size="large" />
                    <div style={{ marginLeft: 12 }}>
                      <div style={{ fontWeight: 600 }}>{post.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'gray' }}>
                        {new Date(post.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </div>
                  {post.imageUrl && (
                    <div style={{ marginBottom: 15, borderRadius: 8, overflow: 'hidden' }}>
                      <img 
                        src={post.imageUrl} 
                        alt="Post content" 
                        style={{ width: '100%', display: 'block', objectFit: 'cover' }} 
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 20, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                    <Button type="text" icon={<HeartOutlined />}>
                      {post.likes || 0}
                    </Button>
                    <Button type="text" icon={<CommentOutlined />}>
                      {post.commentsCount || 0}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Chưa có bài viết nào" />
          )}
        </div>
      )
    });
  }
  
  // Friends tab - only show if own profile or privacy allows
  if (isOwnProfile || privacySettings.showFriends) {
    tabItems.push({
      key: 'friends',
      label: (
        <span>
          Bạn bè
          {isOwnProfile && friendRequests.length > 0 && (
            <Badge count={friendRequests.length} offset={[8, 0]} />
          )}
        </span>
      ),
      children: null
    });
  }
  
  // Settings tab - only for own profile
  if (isOwnProfile) {
    tabItems.push({
      key: 'settings',
      label: 'Cài đặt',
      children: (
        <Card title="Cài đặt quyền riêng tư">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>Cho phép người khác xem Tổng quan</Title>
                <Text type="secondary">Cho phép người khác xem thống kê học tập của bạn</Text>
              </div>
              <Switch
                checked={privacySettings.showOverview}
                onChange={(checked) => handlePrivacyChange('showOverview', checked)}
              />
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>Cho phép người khác xem Blog</Title>
                <Text type="secondary">Cho phép người khác xem các bài viết của bạn</Text>
              </div>
              <Switch
                checked={privacySettings.showBlog}
                onChange={(checked) => handlePrivacyChange('showBlog', checked)}
              />
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>Cho phép người khác xem Bạn bè</Title>
                <Text type="secondary">Cho phép người khác xem danh sách bạn bè của bạn</Text>
              </div>
              <Switch
                checked={privacySettings.showFriends}
                onChange={(checked) => handlePrivacyChange('showFriends', checked)}
              />
            </div>
          </Space>
        </Card>
      )
    });
  }

  return (
    <div className={styles.profilePageContainer}>
      <div className={styles.profileLayout}>
        {/* Sidebar */}
        <aside className={styles.profileSidebar}>
          <Card className={styles.profileCard}>
            {/* Cover Image */}
            <div className={styles.coverImage}></div>
            
            <div className={styles.profileContent}>
              {/* Avatar */}
              <div className={styles.avatarSection}>
                {isOwnProfile ? (
                  <Upload
                    beforeUpload={beforeUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <div className={styles.avatarWrapper}>
                      <Avatar
                        size={96}
                        src={user?.avatar_url}
                        icon={!user?.avatar_url && <UserOutlined />}
                        className={styles.avatar}
                      />
                      <div className={styles.avatarEditButton}>
                        <CameraOutlined />
                      </div>
                    </div>
                  </Upload>
                ) : (
                  <div className={styles.avatarWrapper}>
                    <Avatar
                      size={96}
                      src={user?.avatar_url}
                      icon={!user?.avatar_url && <UserOutlined />}
                      className={styles.avatar}
                    />
                    <div className={styles.onlineIndicator}></div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className={styles.userInfo}>
                <Title level={3} className={styles.userName}>
                  {user?.name || 'Chưa có tên'}
                </Title>
                <Text type="secondary" className={styles.userTagline}>
                  {user?.bio || 'Chưa có mô tả'}
                </Text>
                <Text type="secondary" className={styles.userEmail}>
                  {user?.email || ''}
                </Text>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                {isOwnProfile ? (
                  <>
                    <Button
                      icon={<EditOutlined />}
                      onClick={handleEdit}
                      block
                      className={styles.editButton}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      icon={<ShareAltOutlined />}
                      block
                      type="primary"
                    >
                      Chia sẻ
                    </Button>
                  </>
                ) : (
                  <>
                    {friendshipStatus?.status === 'friends' ? (
                      // If already friends, show message and unfriend buttons
                      <>
                        <Button
                          icon={<MessageOutlined />}
                          block
                          type="primary"
                        >
                          Nhắn tin
                        </Button>
                        <Button
                          icon={<CloseCircleOutlined />}
                          block
                          danger
                          onClick={handleRemoveFriend}
                        >
                          Hủy kết bạn
                        </Button>
                      </>
                    ) : friendshipStatus?.status === 'pending' ? (
                      (() => {
                        console.log('Friendship status:', friendshipStatus);
                        console.log('isSender:', friendshipStatus.isSender);
                        return friendshipStatus.isSender ? (
                          <>
                            <Button block disabled>
                              Đã gửi lời mời
                            </Button>
                            <Button
                              icon={<MessageOutlined />}
                              block
                            >
                              Nhắn tin
                            </Button>
                          </>
                        ) : (
                          <Button
                            icon={<UserAddOutlined />}
                            block
                            type="primary"
                            onClick={async () => {
                              try {
                                console.log('Finding friend request to accept. Current userId:', userId);
                                console.log('Friend requests:', friendRequests);
                                // Find the pending request where current user is receiver and viewed user is sender
                                const request = friendRequests.find(r => {
                                  const senderId = typeof r.senderId === 'object' 
                                    ? r.senderId._id 
                                    : r.senderId;
                                  console.log('Checking request:', { senderId, userId, match: senderId === userId });
                                  return senderId === userId;
                                });
                                if (request) {
                                  console.log('Found request to accept:', request);
                                  await handleAcceptFriendRequest(request._id);
                                  // Refresh friendship status after accepting
                                  await checkFriendship();
                                } else {
                                  console.log('No matching request found');
                                  messageApi.warning('Không tìm thấy lời mời kết bạn. Vui lòng làm mới trang.');
                                }
                              } catch (error) {
                                console.error('Error in accept button click:', error);
                              }
                            }}
                          >
                            Chấp nhận lời mời
                          </Button>
                        );
                      })()
                    ) : (
                      <>
                        <Button
                          icon={<UserAddOutlined />}
                          block
                          type="primary"
                          onClick={handleAddFriend}
                        >
                          Kết bạn
                        </Button>
                        <Button
                          icon={<MessageOutlined />}
                          block
                        >
                          Nhắn tin
                        </Button>
                        <Button
                          icon={<MoreOutlined />}
                          block
                        >
                          Thêm
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>

              <Divider style={{ margin: '24px 0' }} />

              {/* User Details */}
              <div className={styles.userDetails}>
                {user?.location && (
                  <div className={styles.detailItem}>
                    <EnvironmentOutlined className={styles.detailIcon} />
                    <Text>{user.location}</Text>
                  </div>
                )}
                {user?.createdAt && (
                  <div className={styles.detailItem}>
                    <CalendarOutlined className={styles.detailIcon} />
                    <Text>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</Text>
                  </div>
                )}
                {user?.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className={styles.detailItem}>
                    <LinkOutlined className={styles.detailIcon} />
                    <Text>{user.website}</Text>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className={styles.socialCard}>
            <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
              <a href="#" className={styles.socialLink}>TW</a>
              <a href="#" className={styles.socialLink}>LI</a>
              <a href="#" className={styles.socialLink}>GH</a>
              <a href="#" className={styles.socialLink}>IG</a>
            </Space>
          </Card>
        </aside>

        {/* Main Content */}
        <div className={styles.profileMain}>
          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statHeader}>
                <Text type="secondary" className={styles.statLabel}>Khóa học đã hoàn thành</Text>
                <BookOutlined className={styles.statIcon} style={{ color: '#137fec' }} />
              </div>
              <Title level={2} className={styles.statValue}>{stats.coursesCompleted}</Title>
              <Text type="success" className={styles.statChange}>
                <span>+2</span> tháng này
              </Text>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statHeader}>
                <Text type="secondary" className={styles.statLabel}>Huy hiệu</Text>
                <TrophyOutlined className={styles.statIcon} style={{ color: '#fa8c16' }} />
              </div>
              <Title level={2} className={styles.statValue}>{stats.badgesEarned}</Title>
              <Text type="secondary" className={styles.statSubtext}>Top 10% người học</Text>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statHeader}>
                <Text type="secondary" className={styles.statLabel}>Bạn bè</Text>
                <TeamOutlined className={styles.statIcon} style={{ color: '#eb2f96' }} />
              </div>
              <Title level={2} className={styles.statValue}>{stats.friendsCount}</Title>
              <Text type="secondary" className={styles.statSubtext}>
                {stats.mutualFriends} bạn chung
              </Text>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Card className={styles.tabsCard}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabKey)}
              items={tabItems}
              className={styles.profileTabs}
            />
          </Card>

          {/* Tab Content - Only show for friends and settings tabs */}
          {(activeTab === 'friends' || activeTab === 'settings') && (
            <div className={styles.tabContent}>
              {activeTab === 'friends' && (
              <div className={styles.friendsContent}>
                {/* Friend Requests (only for own profile) */}
                {isOwnProfile && friendRequests.length > 0 && (
                  <Card className={styles.friendRequestsCard}>
                    <div className={styles.sectionHeader}>
                      <Title level={4} className={styles.sectionTitle}>
                        Lời mời kết bạn
                        <Badge count={friendRequests.length} style={{ marginLeft: 8 }} />
                      </Title>
                    </div>
                    <div className={styles.friendRequestsList}>
                      {friendRequests.map((request) => (
                        <div key={request._id} className={styles.friendRequestItem}>
                          <div className={styles.friendRequestInfo}>
                            <Avatar
                              size={48}
                              src={request.senderId.avatar_url}
                              icon={!request.senderId.avatar_url && <UserOutlined />}
                              className={styles.friendAvatar}
                            />
                            <div>
                              <Title level={5} style={{ margin: 0 }}>
                                {request.senderId.name}
                              </Title>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {stats.mutualFriends} bạn chung
                              </Text>
                            </div>
                          </div>
                          <Space>
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={() => {
                                console.log('Accept button clicked for request:', request);
                                console.log('Request details:', {
                                  _id: request._id,
                                  senderId: request.senderId,
                                  receiverId: request.receiverId,
                                  status: request.status,
                                });
                                if (request?._id) {
                                  handleAcceptFriendRequest(request._id);
                                } else {
                                  messageApi.error('Không tìm thấy ID lời mời kết bạn');
                                }
                              }}
                            >
                              Chấp nhận
                            </Button>
                            <Button
                              icon={<CloseCircleOutlined />}
                              onClick={() => {
                                if (request?._id) {
                                  handleRejectFriendRequest(request._id);
                                } else {
                                  messageApi.error('Không tìm thấy ID lời mời kết bạn');
                                }
                              }}
                            >
                              Từ chối
                            </Button>
                          </Space>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Friends List */}
                <Card className={styles.friendsListCard}>
                  <div className={styles.sectionHeader}>
                    <Title level={4} className={styles.sectionTitle}>
                      Tất cả bạn bè ({friends.length})
                    </Title>
                    <Space>
                      <Input
                        prefix={<SearchOutlined />}
                        placeholder="Tìm kiếm bạn bè..."
                        value={friendSearchText}
                        onChange={(e) => setFriendSearchText(e.target.value)}
                        style={{ width: 200 }}
                      />
                      <Button icon={<FilterOutlined />} />
                    </Space>
                  </div>

                  {loadingFriends ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <Empty description="Không có bạn bè nào" />
                  ) : (
                    <div className={styles.friendsGrid}>
                      {filteredFriends.map((friend) => (
                        <Card 
                          key={friend._id} 
                          className={styles.friendCard} 
                          hoverable
                          onClick={() => {
                            router.push(`/auth/profile?userId=${friend._id}`);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.friendCardContent}>
                            <Avatar
                              size={56}
                              src={friend.avatar_url}
                              icon={!friend.avatar_url && <UserOutlined />}
                              className={styles.friendCardAvatar}
                            >
                              {!friend.avatar_url && getInitials(friend.name)}
                            </Avatar>
                            <div className={styles.friendCardInfo}>
                              <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                                {friend.name}
                              </Title>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {friend.email}
                              </Text>
                            </div>
                            <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                              <Button 
                                block 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  router.push(`/auth/profile?userId=${friend._id}`);
                                }}
                              >
                                Xem trang cá nhân
                              </Button>
                              <Button 
                                block 
                                size="small" 
                                icon={<MessageOutlined />} 
                                type="text"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  // TODO: Navigate to chat or open chat modal
                                }}
                              >
                                Nhắn tin
                              </Button>
                            </Space>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'settings' && isOwnProfile && (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  className={styles.profileForm}
                >
                  <Form.Item
                    label="Họ và tên"
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

                  <Form.Item label="Email">
                    <Input
                      size="large"
                      value={user?.email || ''}
                      disabled
                      prefix={<MailOutlined />}
                    />
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
                      Email không thể thay đổi
                    </Text>
                  </Form.Item>

                  <Form.Item
                    label="Số điện thoại"
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
                    label="Giới thiệu"
                    name="bio"
                    rules={[
                      { max: 500, message: 'Giới thiệu không được vượt quá 500 ký tự!' },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Viết giới thiệu về bản thân..." : undefined}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  {isEditing && (
                    <Form.Item>
                      <Space>
                        <Button onClick={handleCancel}>
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          onClick={handleSave}
                          loading={saving}
                        >
                          Lưu
                        </Button>
                      </Space>
                    </Form.Item>
                  )}
                </Form>

                <Divider />

                <Button
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  Đổi mật khẩu
                </Button>
              </Card>
            )}
            </div>
          )}
        </div>
      </div>

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
        destroyOnHidden={true}
        centered
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
          destroyOnHidden={true}
          afterClose={() => {
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
