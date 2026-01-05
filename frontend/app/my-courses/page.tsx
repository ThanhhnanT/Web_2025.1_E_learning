'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Progress,
  Tag,
  Button,
  Statistic,
  Tabs,
} from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import enrollmentService, { Enrollment, EnrollmentStats } from '../../service/enrollmentService';
import paymentService from '../../service/paymentService';

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, statsData] = await Promise.all([
        enrollmentService.getMyEnrollments(),
        enrollmentService.getMyStats(),
      ]);
      setEnrollments(enrollmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = (status?: string) => {
    if (!status || status === 'all') return enrollments;
    return enrollments.filter((e) => e.status === status);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleContinueLearning = (enrollment: Enrollment) => {
    const courseId = typeof enrollment.courseId === 'string'
      ? enrollment.courseId
      : enrollment.courseId?._id;
    if (courseId) {
      router.push(`/courses/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'all',
      label: `All (${enrollments.length})`,
      children: null,
    },
    {
      key: 'active',
      label: `Active (${stats?.active || 0})`,
      children: null,
    },
    {
      key: 'completed',
      label: `Completed (${stats?.completed || 0})`,
      children: null,
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '24px' }}>
        <BookOutlined /> My Courses
      </h1>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Courses"
                value={stats.total}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active"
                value={stats.active}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg Progress"
                value={stats.averageProgress}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs for filtering */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Courses List */}
      {filterEnrollments(activeTab === 'all' ? undefined : activeTab).length === 0 ? (
        <Empty
          description={`No ${activeTab === 'all' ? '' : activeTab} courses found`}
          style={{ marginTop: '48px' }}
        >
          <Button type="primary" onClick={() => router.push('/courses')}>
            Browse Courses
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {filterEnrollments(activeTab === 'all' ? undefined : activeTab).map((enrollment) => {
            const course = typeof enrollment.courseId === 'object' ? enrollment.courseId : null;
            if (!course) return null;

            return (
              <Col xs={24} sm={12} md={8} key={enrollment._id}>
                <Card
                  hoverable
                  cover={
                    course.thumbnail_url ? (
                      <img
                        alt={course.title}
                        src={course.thumbnail_url}
                        style={{ height: '160px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '160px',
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleContinueLearning(enrollment)}
                      key="continue"
                    >
                      {enrollment.progress > 0 ? 'Continue' : 'Start Learning'}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={course.title}
                    description={
                      <div>
                        <Tag color={enrollmentService.getStatusColor(enrollment.status)}>
                          {enrollmentService.getStatusLabel(enrollment.status)}
                        </Tag>
                        <div style={{ marginTop: '12px' }}>
                          <Progress
                            percent={enrollment.progress}
                            strokeColor={enrollmentService.getProgressColor(enrollment.progress)}
                            size="small"
                          />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                          Enrolled: {formatDate(enrollment.enrolledAt)}
                        </div>
                        {enrollment.completedAt && (
                          <div style={{ fontSize: '12px', color: '#52c41a' }}>
                            Completed: {formatDate(enrollment.completedAt)}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

