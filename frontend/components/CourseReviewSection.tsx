"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  Rate,
  Typography,
  Avatar,
  Empty,
  Space,
  Divider,
  Button,
  Form,
  Input,
  message,
  Spin,
  Modal,
} from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { getCourseReviews, getCourseAverageRating, createCourseReview } from '@/service/courses';
import { getUserId } from '@/lib/helper';
import type { Comment } from '@/types/comment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import reviewStyles from '@/styles/courseReview.module.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text, Title } = Typography;
const { TextArea } = Input;

interface CourseReviewSectionProps {
  courseId: string;
}

export default function CourseReviewSection({ courseId }: CourseReviewSectionProps) {
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [userReview, setUserReview] = useState<Comment | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const currentUserId = getUserId();

  useEffect(() => {
    if (courseId) {
      fetchReviews();
      fetchRating();
    }
  }, [courseId]);

  // Auto-play reviews carousel
  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 2000); // Change slide every 2 seconds

    return () => clearInterval(interval);
  }, [reviews.length]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getCourseReviews(courseId);
      setReviews(data || []);
      
      // Check if current user has already reviewed
      if (currentUserId) {
        const userReviewData = data?.find((review: Comment) => review.userId === currentUserId);
        setUserReview(userReviewData || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      message.error('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      const data = await getCourseAverageRating(courseId);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleSubmitReview = async (values: { rating: number; content: string }) => {
    if (!currentUserId) {
      message.warning('Vui lòng đăng nhập để đánh giá');
      return;
    }

    try {
      setSubmitting(true);
      await createCourseReview(courseId, values.rating, values.content, currentUserId);
      message.success('Đánh giá của bạn đã được gửi thành công!');
      form.resetFields();
      setReviewModalVisible(false);
      await fetchReviews();
      await fetchRating();
      setUserReview(null); // Will be updated by fetchReviews
    } catch (error: any) {
      console.error('Error submitting review:', error);
      message.error(error?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return dayjs(dateString).fromNow();
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div className={reviewStyles.reviewSection}>
      {/* Rating Summary */}
      <Card>
        <div className={reviewStyles.ratingSummary}>
          <div className={reviewStyles.ratingValue}>
            <Title level={2} className={reviewStyles.ratingValue}>
              {averageRating.toFixed(1)}
            </Title>
            <Rate disabled value={averageRating} allowHalf className={reviewStyles.ratingStars} />
            <Text type="secondary" className={reviewStyles.ratingCount} style={{ fontSize: '10px' }}>
              {totalReviews} {totalReviews === 1 ? 'đánh giá' : 'đánh giá'}
            </Text>
            {currentUserId && !userReview && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => setReviewModalVisible(true)}
                style={{ marginTop: 8, padding: 0, height: 'auto', fontSize: 12 }}
              >
                Viết đánh giá
              </Button>
            )}
          </div>
          <Divider type="vertical" style={{ height: 80 }} />
          <div className={reviewStyles.ratingDistribution}>
            {/* Rating Distribution */}
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className={reviewStyles.ratingBar}>
                  <Text className={reviewStyles.ratingBarLabel}>{star} sao</Text>
                  <div className={reviewStyles.ratingBarProgress}>
                    <div
                      className={reviewStyles.ratingBarFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <Text type="secondary" className={reviewStyles.ratingBarCount}>
                    {count}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Review Form Modal */}
      <Modal
        title="Viết đánh giá"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
          <Form.Item
            name="rating"
            label="Đánh giá của bạn"
            rules={[{ required: true, message: 'Vui lòng chọn số sao đánh giá' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung đánh giá"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung đánh giá' },
              { min: 10, message: 'Nội dung đánh giá phải có ít nhất 10 ký tự' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                Gửi đánh giá
              </Button>
              <Button onClick={() => {
                setReviewModalVisible(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reviews Carousel */}
      <Card title={`Đánh giá (${reviews.length})`} className={reviewStyles.reviewsList}>
        {reviews.length === 0 ? (
          <Empty description="Chưa có đánh giá nào" />
        ) : (
          <div className={reviewStyles.reviewsCarousel}>
            <div
              className={reviewStyles.reviewsCarouselTrack}
              style={{
                transform: `translateX(-${currentReviewIndex * 100}%)`,
              }}
            >
              {reviews.map((review, index) => (
                <div key={review._id} className={reviewStyles.reviewSlide}>
                  <div className={reviewStyles.reviewBubble}>
                    <div className={reviewStyles.reviewBubbleHeader}>
                      <Avatar
                        src={review.user?.avatar_url}
                        icon={<UserOutlined />}
                        size={48}
                        className={reviewStyles.reviewAvatar}
                      />
                      <div className={reviewStyles.reviewBubbleInfo}>
                        <Text strong className={reviewStyles.reviewAuthor}>
                          {review.user?.name || 'Người dùng'}
                        </Text>
                        {review.rating && (
                          <Rate disabled value={review.rating} className={reviewStyles.reviewRating} />
                        )}
                      </div>
                    </div>
                    <div className={reviewStyles.reviewBubbleContent}>
                      <Text className={reviewStyles.reviewText}>{review.content}</Text>
                    </div>
                    <Text type="secondary" className={reviewStyles.reviewDate}>
                      {formatDate(review.createdAt)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
            {reviews.length > 1 && (
              <div className={reviewStyles.carouselIndicators}>
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    className={`${reviewStyles.carouselDot} ${index === currentReviewIndex ? reviewStyles.carouselDotActive : ''}`}
                    onClick={() => setCurrentReviewIndex(index)}
                    aria-label={`Go to review ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

