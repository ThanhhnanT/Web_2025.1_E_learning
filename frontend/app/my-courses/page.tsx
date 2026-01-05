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
import enrollmentService, { Enrollment, EnrollmentStats, EnrollmentProgress } from '../../service/enrollmentService';
import paymentService from '../../service/paymentService';

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [progressMap, setProgressMap] = useState<Record<string, EnrollmentProgress>>({});

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh progress when lesson is marked complete or when page becomes visible
  useEffect(() => {
    const handleProgressUpdate = async () => {
      // Get current enrollments from state
      const currentEnrollments = enrollments;
      if (currentEnrollments.length > 0) {
        const progressPromises = currentEnrollments.map(async (enrollment) => {
          try {
            const progress = await enrollmentService.getEnrollmentProgress(enrollment._id);
            return { enrollmentId: enrollment._id, progress };
          } catch (error) {
            console.error(`Error refreshing progress for enrollment ${enrollment._id}:`, error);
            return { enrollmentId: enrollment._id, progress: null };
          }
        });

        const progressResults = await Promise.all(progressPromises);
        const newProgressMap: Record<string, EnrollmentProgress> = {};
        progressResults.forEach(({ enrollmentId, progress }) => {
          if (progress) {
            newProgressMap[enrollmentId] = progress;
          }
        });
        setProgressMap(newProgressMap);
      }
    };

    // Listen for custom event when lesson is marked complete
    const handleLessonComplete = () => {
      handleProgressUpdate();
    };

    // Refresh when page becomes visible (user returns from course page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleProgressUpdate();
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      handleProgressUpdate();
    };

    window.addEventListener('lessonCompleted', handleLessonComplete);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('lessonCompleted', handleLessonComplete);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enrollments]); // Refresh when enrollments change

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, statsData] = await Promise.all([
        enrollmentService.getMyEnrollments(),
        enrollmentService.getMyStats(),
      ]);
      setEnrollments(enrollmentsData);
      setStats(statsData);

      // Fetch progress for each enrollment
      const progressPromises = enrollmentsData.map(async (enrollment) => {
        try {
          const progress = await enrollmentService.getEnrollmentProgress(enrollment._id);
          return { enrollmentId: enrollment._id, progress };
        } catch (error) {
          console.error(`Error fetching progress for enrollment ${enrollment._id}:`, error);
          return { enrollmentId: enrollment._id, progress: null };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const newProgressMap: Record<string, EnrollmentProgress> = {};
      progressResults.forEach(({ enrollmentId, progress }) => {
        if (progress) {
          newProgressMap[enrollmentId] = progress;
        }
      });
      setProgressMap(newProgressMap);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = (status?: string) => {
    if (!status || status === 'all') return enrollments;
    
    return enrollments.filter((e) => {
      // Calculate actual progress for this enrollment
      const enrollmentProgress = progressMap[e._id];
      let actualProgress = 0;
      
      if (enrollmentProgress && enrollmentProgress.totalLessons > 0) {
        actualProgress = Math.round(
          (enrollmentProgress.completedCount / enrollmentProgress.totalLessons) * 100
        );
      } else if (e.progress !== undefined) {
        actualProgress = Math.round(Math.max(0, Math.min(100, e.progress || 0)));
      }
      
      const isActuallyCompleted = actualProgress >= 100;
      
      if (status === 'completed') {
        // For completed tab, only show if actually completed (progress >= 100)
        return isActuallyCompleted;
      }
      // For active tab, show if not completed and not suspended
      if (status === 'active') {
        return !isActuallyCompleted && e.status !== 'suspended';
      }
      return e.status === status;
    });
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
      label: `Tất cả (${enrollments.length})`,
      children: null,
    },
    {
      key: 'active',
      label: `Đang học (${stats?.active || 0})`,
      children: null,
    },
    {
      key: 'completed',
      label: `Đã hoàn thành (${stats?.completed || 0})`,
      children: null,
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '24px' }}>
        <BookOutlined /> Khóa học của tôi
      </h1>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng khóa học"
                value={stats.total}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang học"
                value={stats.active}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã hoàn thành"
                value={stats.completed}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tiến độ trung bình"
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
          description={
            activeTab === 'all' 
              ? 'Chưa có khóa học nào' 
              : activeTab === 'active' 
              ? 'Không có khóa học đang học' 
              : 'Không có khóa học đã hoàn thành'
          }
          style={{ marginTop: '48px' }}
        >
          <Button type="primary" onClick={() => router.push('/courses')}>
            Duyệt khóa học
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {filterEnrollments(activeTab === 'all' ? undefined : activeTab).map((enrollment) => {
            const course = typeof enrollment.courseId === 'object' ? enrollment.courseId : null;
            if (!course) return null;

            // Get progress from API - use progressPercentage if available, otherwise calculate
            const enrollmentProgress = progressMap[enrollment._id];
            let finalProgress = 0;
            
            if (enrollmentProgress) {
              // Use progressPercentage from API if available
              if (enrollmentProgress.progressPercentage !== undefined && enrollmentProgress.progressPercentage !== null) {
                finalProgress = Math.round(Math.max(0, Math.min(100, enrollmentProgress.progressPercentage)));
              } else if (enrollmentProgress.totalLessons > 0) {
                // Calculate from completedCount / totalLessons if progressPercentage not available
                finalProgress = Math.round(
                  (enrollmentProgress.completedCount / enrollmentProgress.totalLessons) * 100
                );
              }
            } else if (enrollment.progress !== undefined) {
              // Fallback to enrollment.progress if API data not available
              finalProgress = Math.round(Math.max(0, Math.min(100, enrollment.progress || 0)));
            }
            
            // Determine actual status - only "completed" if progress is 100%
            // Always use 'active' if progress < 100, regardless of enrollment.status
            const actualStatus = finalProgress >= 100 ? 'completed' : 'active';
            const isActuallyCompleted = finalProgress >= 100;

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
                      {finalProgress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={course.title}
                    description={
                      <div>
                        <Tag color={enrollmentService.getStatusColor(actualStatus)}>
                          {enrollmentService.getStatusLabel(actualStatus)}
                        </Tag>
                        <div style={{ marginTop: '12px' }}>
                          <Progress
                            percent={finalProgress}
                            strokeColor={{
                              '0%': '#108ee9',
                              '100%': '#87d068',
                            }}
                            size="small"
                            format={(percent) => `${percent}%`}
                          />
                        </div>
                        {enrollmentProgress && enrollmentProgress.totalLessons > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                            {enrollmentProgress.completedCount}/{enrollmentProgress.totalLessons} bài học đã hoàn thành
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                          Đã đăng ký: {formatDate(enrollment.enrolledAt)}
                        </div>
                        {isActuallyCompleted && enrollment.completedAt && (
                          <div style={{ fontSize: '12px', color: '#52c41a' }}>
                            Hoàn thành: {formatDate(enrollment.completedAt)}
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

