"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Empty,
  Button,
  Progress,
  Tag,
  Space,
  message,
} from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { getUserLearningPaths } from '@/service/aiLearningPathService';
import styles from '@/styles/aiLearningPathsList.module.css';

const { Title, Text } = Typography;

interface LearningPathItem {
  _id: string;
  learningPathId: string;
  roadmapId: string;
  title: string;
  level: string;
  totalDays: number;
  currentDay: number;
  progressPercentage: number;
  estimatedHours: number;
  createdAt: string;
  lastAccessed: string;
}

export default function AILearningPathsListPage() {
  const router = useRouter();
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserLearningPaths();
      
      // Handle both array response and wrapped response
      const paths = Array.isArray(response) ? response : (response?.data || response || []);
      
      if (Array.isArray(paths)) {
        setLearningPaths(paths);
      } else {
        console.error('Unexpected response format:', response);
        setLearningPaths([]);
      }
    } catch (err: any) {
      console.error('Error fetching learning paths:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách lộ trình học tập';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const getLevelText = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'Cơ bản';
      case 'intermediate':
        return 'Trung bình';
      case 'advanced':
        return 'Nâng cao';
      default:
        return level || 'Chưa xác định';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" tip="Đang tải danh sách lộ trình học tập..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={fetchLearningPaths}>
            Thử lại
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 12 }} />
            Lộ trình học tập AI của tôi
          </Title>
          <Text type="secondary">
            Quản lý và theo dõi các lộ trình học tập được tạo bởi AI
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => router.push('/courses')}
        >
          Tạo lộ trình mới
        </Button>
      </div>

      {/* Learning Paths List */}
      {learningPaths.length === 0 ? (
        <Card>
          <Empty
            description="Bạn chưa có lộ trình học tập nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/courses')}
            >
              Tạo lộ trình học tập đầu tiên
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {learningPaths.map((path) => (
            <Col xs={24} sm={12} lg={8} key={path.learningPathId || path._id}>
              <Card
                className={styles.learningPathCard}
                hoverable
                onClick={() => router.push(`/ai-learning-paths/${path.learningPathId || path._id}`)}
                cover={
                  <div className={styles.cardCover}>
                    <BookOutlined className={styles.cardIcon} />
                  </div>
                }
                actions={[
                  <Button
                    type="link"
                    icon={<PlayCircleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/ai-learning-paths/${path.learningPathId || path._id}`);
                    }}
                  >
                    Tiếp tục học
                  </Button>,
                ]}
              >
                <div className={styles.cardContent}>
                  <div style={{ marginBottom: 12 }}>
                    <Tag color={getLevelColor(path.level)} style={{ marginBottom: 8 }}>
                      {getLevelText(path.level)}
                    </Tag>
                    <Title level={4} className={styles.cardTitle} ellipsis={{ tooltip: path.title }}>
                      {path.title}
                    </Title>
                  </div>

                  <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">
                        <ClockCircleOutlined /> {path.totalDays} ngày
                      </Text>
                      <Text type="secondary">
                        {path.estimatedHours} giờ học
                      </Text>
                    </div>
                  </Space>

                  {/* Progress */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 12 }}>Tiến độ</Text>
                      <Text strong style={{ fontSize: 12 }}>{path.progressPercentage}%</Text>
                    </div>
                    <Progress
                      percent={path.progressPercentage}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      size="small"
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                      Đã hoàn thành {path.currentDay - 1} / {path.totalDays} ngày
                    </Text>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Tạo ngày: {formatDate(path.createdAt)}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

