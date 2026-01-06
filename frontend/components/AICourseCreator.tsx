"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Radio,
  Slider,
  Typography,
  Row,
  Col,
  Tag,
  message,
  Progress,
  Image,
  Avatar,
  Spin,
} from 'antd';
import { 
  ThunderboltOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from '@/styles/aiCourseCreator.module.css';
import { generateLearningPath, getUserLearningPaths } from '@/service/aiLearningPathService';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface AICourseCreatorProps {
  className?: string;
}

interface GeneratedCourse {
  learningPathId: string;
  roadmapId: string;
  title: string;
  level: string;
  totalDays: number;
  estimatedHours: number;
  skills: Record<string, string[]>;
  learning_path: any[];
  isGenerating: boolean;
  progress: number;
  imageUrl?: string | null;
}

const AICourseCreator: React.FC<AICourseCreatorProps> = ({ className }) => {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [progress, setProgress] = useState(0);
  const [existingLearningPaths, setExistingLearningPaths] = useState<any[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);

  // Fetch existing learning paths on mount
  useEffect(() => {
    fetchExistingLearningPaths();
  }, []);

  const fetchExistingLearningPaths = async () => {
    try {
      setLoadingPaths(true);
      console.log('[AICourseCreator] Fetching existing learning paths...');
      
      const response = await getUserLearningPaths();
      console.log('[AICourseCreator] API Response:', response);
      
      // Handle both array response and wrapped response
      const paths = Array.isArray(response) ? response : (response?.data || response || []);
      console.log('[AICourseCreator] Parsed paths:', paths);
      
      if (Array.isArray(paths)) {
        console.log(`[AICourseCreator] Found ${paths.length} learning paths`);
        setExistingLearningPaths(paths);
      } else {
        console.error('[AICourseCreator] Unexpected response format:', response);
        setExistingLearningPaths([]);
      }
    } catch (err: any) {
      console.error('[AICourseCreator] Error fetching learning paths:', err);
      console.error('[AICourseCreator] Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      setExistingLearningPaths([]);
    } finally {
      setLoadingPaths(false);
    }
  };

  const handleGenerate = async () => {
    // Validate form
    if (!topic.trim()) {
      message.error('Vui lòng nhập mục tiêu học tập của bạn');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    // Calculate estimated hours and weeks
    const estimatedHours = weeklyHours * 6; // 6 weeks average
    const estimatedWeeks = Math.ceil(estimatedHours / weeklyHours);

    // Create preview course card immediately
    const previewCourse: GeneratedCourse = {
      learningPathId: '',
      roadmapId: '',
      title: topic.trim(),
      level: proficiency,
      totalDays: estimatedWeeks * 7,
      estimatedHours: estimatedHours,
      skills: {},
      learning_path: [],
      isGenerating: true,
      progress: 0,
      imageUrl: null, // Will be set when API returns
    };
    setGeneratedCourse(previewCourse);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const response = await generateLearningPath({
        goal: topic.trim(),
        level: proficiency,
        description: goals.trim() || undefined,
        estimatedHours: estimatedHours,
        weeklyHours: weeklyHours,
        goals: goals.trim() || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        // Update generated course with imageUrl if available
        if (response.data.imageUrl) {
          setGeneratedCourse(prev => prev ? { ...prev, imageUrl: response.data.imageUrl } : null);
        }
        
        // Clear generated course card immediately to hide it from action area
        setGeneratedCourse(null);
        
        // Reset form
        setTopic('');
        setProficiency('Beginner');
        setWeeklyHours(5);
        setGoals('');
        
        // Refresh list first to show the new course in "Lộ trình học tập của tôi"
        await fetchExistingLearningPaths();
        
        message.success('Tạo lộ trình học tập thành công!');
      } else {
        throw new Error(response.message || 'Không thể tạo lộ trình học tập');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      const errorMessage = err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi khi tạo lộ trình học tập. Vui lòng thử lại.';
      setError(errorMessage);
      setGeneratedCourse(null);
      message.error(errorMessage);
      console.error('Error generating learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = () => {
    if (generatedCourse && !generatedCourse.isGenerating && generatedCourse.learningPathId) {
      router.push(`/ai-learning-paths/${generatedCourse.learningPathId}`);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'green';
      case 'Intermediate':
        return 'orange';
      case 'Advanced':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'Cơ bản';
      case 'Intermediate':
        return 'Trung bình';
      case 'Advanced':
        return 'Nâng cao';
      default:
        return level;
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.contentWrapper}>
        {/* Single Card with all content */}
        <Card className={styles.mainCard}>
          {/* Heading Section */}
          <div className={styles.headingSection}>
            <div className={styles.badge}>
              <ThunderboltOutlined className={styles.badgeIcon} />
              <span className={styles.badgeText}>Được hỗ trợ bởi AI</span>
            </div>
            <Title level={1} className={styles.mainTitle}>
              Thiết kế lộ trình học tập của bạn
            </Title>
            <Text className={styles.subtitle}>
              Cho chúng tôi biết bạn muốn học gì, và AI của chúng tôi sẽ tạo ra một chương trình học được cá nhân hóa dành riêng cho bạn.
            </Text>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Section 1: Topic */}
          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelText}>Bạn muốn học gì?</span>
              <TextArea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Python cho Khoa học Dữ liệu, Lịch sử Pháp thế kỷ 19, Làm vườn hữu cơ cho người mới bắt đầu..."
                className={styles.textArea}
                rows={6}
              />
              <Text type="secondary" className={styles.hint}>
                Hãy mô tả càng chi tiết càng tốt. AI sẽ sử dụng thông tin này để cấu trúc các module của bạn.
              </Text>
            </label>
          </div>

          <Row gutter={[32, 32]}>
            {/* Section 2: Proficiency Level */}
            <Col xs={24} md={12}>
              <div className={styles.formSection}>
                <div className={styles.proficiencyContainer}>
                  <span className={styles.labelText}>Trình độ hiện tại</span>
                  <Radio.Group
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className={styles.proficiencyGroup}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="Beginner">Cơ bản</Radio.Button>
                    <Radio.Button value="Intermediate">Trung bình</Radio.Button>
                    <Radio.Button value="Advanced">Nâng cao</Radio.Button>
                  </Radio.Group>
                </div>
              </div>
            </Col>

            {/* Section 3: Time Commitment */}
            <Col xs={24} md={12}>
              <div className={styles.formSection}>
                <div className={styles.sliderHeader}>
                  <span className={styles.labelText}>Thời gian học mỗi tuần</span>
                  <Tag color="blue" className={styles.hoursTag}>
                    {weeklyHours} giờ
                  </Tag>
                </div>
                <div className={styles.sliderContainer}>
                  <Slider
                    min={1}
                    max={20}
                    value={weeklyHours}
                    onChange={setWeeklyHours}
                    className={styles.slider}
                  />
                </div>
                <div className={styles.sliderLabels}>
                  <Text type="secondary" className={styles.sliderLabel}>1 giờ</Text>
                  <Text type="secondary" className={styles.sliderLabel}>10 giờ</Text>
                  <Text type="secondary" className={styles.sliderLabel}>20+ giờ</Text>
                </div>
              </div>
            </Col>
          </Row>

          {/* Section 4: Description / Goals */}
          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelText}>Mục tiêu học tập & Sở thích (Tùy chọn)</span>
              <TextArea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Cho chúng tôi biết thêm về cách bạn thích học (ví dụ: 'Tôi thích nội dung video', 'Tập trung vào bài tập thực hành', 'Tôi cần điều này cho buổi phỏng vấn xin việc tuần tới')..."
                className={styles.textArea}
                rows={4}
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
              <Text type="danger">{error}</Text>
            </div>
          )}

          {/* Action Area */}
          <div className={styles.actionArea}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
              className={styles.generateButton}
              disabled={loading}
            >
              Tạo khóa học của tôi
            </Button>
            <Text type="secondary" className={styles.actionHint}>
              Quá trình tạo bằng AI thường mất 30-60 giây. Bạn có thể chỉnh sửa chương trình học sau.
            </Text>
          </div>
        </Card>

        {/* Generated Course Card - Show immediately after form while generating */}
        {generatedCourse && generatedCourse.isGenerating && (
          <Card
            hoverable={!generatedCourse.isGenerating}
            className={styles.generatedCourseCard}
            style={{
              opacity: generatedCourse.isGenerating ? 0.8 : 1,
              cursor: generatedCourse.isGenerating ? 'not-allowed' : 'pointer',
            }}
            onClick={handleCourseClick}
            cover={
              <div style={{ 
                height: 200, 
                background: generatedCourse.imageUrl 
                  ? `url(${generatedCourse.imageUrl})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {!generatedCourse.imageUrl && (
                  <BookOutlined style={{ fontSize: 64, color: 'white', opacity: 0.8 }} />
                )}
                {generatedCourse.isGenerating && (
                  <div style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                  }}>
                    <Progress 
                      percent={Math.round(progress)} 
                      strokeColor="#52c41a"
                      showInfo={true}
                    />
                  </div>
                )}
              </div>
            }
          >
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={getLevelColor(generatedCourse.level)}>
                  {getLevelText(generatedCourse.level)}
                </Tag>
                <Text type="secondary">
                  <ClockCircleOutlined /> {generatedCourse.totalDays} ngày
                </Text>
              </div>
              <Title level={4} style={{ marginBottom: 8, marginTop: 0 }}>
                {generatedCourse.title}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {goals || 'Lộ trình học tập được tạo bởi AI'}
              </Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  <UserOutlined /> {generatedCourse.estimatedHours} giờ học
                </Text>
                {generatedCourse.isGenerating ? (
                  <Text type="secondary">Đang tạo...</Text>
                ) : (
                  <Button type="primary" onClick={(e) => { e.stopPropagation(); handleCourseClick(); }}>
                    Xem chi tiết
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Existing Learning Paths List */}
        {existingLearningPaths.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                Lộ trình học tập của tôi ({existingLearningPaths.length})
              </Title>
              <Button 
                type="link" 
                onClick={fetchExistingLearningPaths}
                loading={loadingPaths}
              >
                Làm mới
              </Button>
            </div>
            <Row gutter={[16, 16]}>
              {existingLearningPaths.map((path) => (
                <Col xs={24} sm={12} lg={8} key={path.learningPathId || path._id}>
                  <Card
                    hoverable
                    onClick={() => router.push(`/ai-learning-paths/${path.learningPathId || path._id}`)}
                    style={{
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                    }}
                    className={styles.existingPathCard}
                    cover={
                      <div style={{
                        height: 120,
                        background: path.imageUrl 
                          ? `url(${path.imageUrl})` 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {!path.imageUrl && (
                          <BookOutlined style={{ fontSize: 48, color: 'white', opacity: 0.9 }} />
                        )}
                      </div>
                    }
                  >
                    <div>
                      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={getLevelColor(path.level)}>
                          {getLevelText(path.level)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined /> {path.totalDays} ngày
                        </Text>
                      </div>
                      <Title level={5} style={{ marginBottom: 8, marginTop: 0 }} ellipsis={{ tooltip: path.title }}>
                        {path.title}
                      </Title>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 12 }}>Tiến độ</Text>
                          <Text strong style={{ fontSize: 12 }}>{path.progressPercentage || 0}%</Text>
                        </div>
                        <Progress
                          percent={path.progressPercentage || 0}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {path.estimatedHours} giờ học
                        </Text>
                        <Button 
                          type="primary" 
                          size="small"
                          icon={<PlayCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/ai-learning-paths/${path.learningPathId || path._id}`);
                          }}
                        >
                          Tiếp tục
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Loading state for existing paths */}
        {loadingPaths && existingLearningPaths.length === 0 && (
          <div style={{ marginTop: 48, textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Đang tải danh sách lộ trình học tập..." />
          </div>
        )}

      </div>
    </div>
  );
};

export default AICourseCreator;

