"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Progress,
  Space,
  Tag,
  Divider,
  Collapse,
  List,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  YoutubeOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { getLearningPath } from '@/service/aiLearningPathService';
import RoadmapSkillTree from '@/components/RoadmapSkillTree';
import VideoPlayer from '@/components/VideoPlayer';
import styles from '@/styles/courseDetail.module.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface LearningPathDay {
  day: number;
  skill: string;
  subskill: string;
  youtube_links?: string;
  theory?: string;
  question_review?: Array<{
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    level: string;
  }>;
}

interface LearningPathData {
  learningPathId: string;
  roadmapId: string;
  title: string;
  level: string;
  totalDays: number;
  estimatedHours: number;
  currentDay: number;
  progressPercentage: number;
  completedDays?: number[];
  skills: Record<string, string[]>;
  learning_path: LearningPathDay[];
}

export default function AILearningPathPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<LearningPathDay | null>(null);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchLearningPath();
    }
  }, [id]);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      const response = await getLearningPath(id);
      if (response) {
        setLearningPath(response);
        // Auto-select first day if available
        if (response.learning_path && response.learning_path.length > 0) {
          const firstDay = response.learning_path[0];
          setSelectedDay(firstDay);
        }
      }
    } catch (error: any) {
      console.error('Error fetching learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const isYouTubeUrl = (url: string): boolean => {
    return /youtube\.com|youtu\.be/i.test(url);
  };

  const convertToEmbedUrl = (url: string): string => {
    if (url.includes('embed')) {
      return url;
    }
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url;
  };

  const handleDayClick = (day: LearningPathDay) => {
    setSelectedDay(day);
  };

  const isDayCompleted = (day: number) => {
    return learningPath?.completedDays?.includes(day) || false;
  };

  const isDayCurrent = (day: number) => {
    return learningPath?.currentDay === day;
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className={styles.container}>
        <Empty description="Không tìm thấy lộ trình học tập" />
        <Button onClick={() => router.back()} style={{ marginTop: 16 }}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className={styles.backButton}
      >
        Quay lại
      </Button>

      {/* Roadmap Skill Tree - At the top */}
      {learningPath.skills && Object.keys(learningPath.skills).length > 0 && (
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Roadmap kỹ năng
          </Title>
          <RoadmapSkillTree
            skills={learningPath.skills}
            onSkillClick={(skill, subskill) => {
              console.log('Skill clicked:', skill, subskill);
            }}
          />
        </Card>
      )}

      <Row gutter={[24, 24]}>
        {/* Left Column - Day Content */}
        <Col xs={24} lg={16}>
          <Card className={styles.videoCard}>
            {selectedDay ? (
              <>
                {/* Day Header */}
                <div className={styles.videoInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Tag color={getLevelColor(learningPath.level)}>
                      {getLevelText(learningPath.level)}
                    </Tag>
                    <Text type="secondary">
                      <ClockCircleOutlined /> Ngày {selectedDay.day} / {learningPath.totalDays}
                    </Text>
                    <Text type="secondary">
                      <UserOutlined /> {learningPath.estimatedHours} giờ học
                    </Text>
                  </div>
                  <Title level={4}>{selectedDay.subskill}</Title>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    <Tag>{selectedDay.skill}</Tag>
                  </Text>
                </div>

                <Divider />

                {/* Video Content */}
                {selectedDay.youtube_links && (
                  <div style={{ marginBottom: 24 }}>
                    {isYouTubeUrl(selectedDay.youtube_links) ? (
                      // YouTube iframe embed
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8 }}>
                        <iframe
                          src={convertToEmbedUrl(selectedDay.youtube_links)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`Video ngày ${selectedDay.day}`}
                        />
                      </div>
                    ) : (
                      // Non-YouTube video - use VideoPlayer
                      <VideoPlayer src={selectedDay.youtube_links} />
                    )}
                  </div>
                )}

                {/* Theory */}
                {selectedDay.theory && (
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>
                      <FileTextOutlined /> Lý thuyết
                    </Title>
                    <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {selectedDay.theory}
                    </Paragraph>
                  </div>
                )}

                {/* Questions */}
                {selectedDay.question_review && selectedDay.question_review.length > 0 && (
                  <div>
                    <Title level={5}>
                      <QuestionCircleOutlined /> Câu hỏi ôn tập
                    </Title>
                    <List
                      dataSource={selectedDay.question_review}
                      renderItem={(question, idx) => (
                        <List.Item>
                          <Card style={{ width: '100%' }}>
                            <Text strong>
                              Câu {idx + 1}: {question.question_text}
                            </Text>
                            <div style={{ marginTop: 12 }}>
                              {question.options?.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  style={{
                                    padding: '8px 12px',
                                    marginBottom: 4,
                                    backgroundColor:
                                      option === question.correct_answer
                                        ? '#f6ffed'
                                        : '#fafafa',
                                    border:
                                      option === question.correct_answer
                                        ? '1px solid #b7eb8f'
                                        : '1px solid #d9d9d9',
                                    borderRadius: 4,
                                  }}
                                >
                                  {option}
                                  {option === question.correct_answer && (
                                    <CheckCircleOutlined
                                      style={{ color: '#52c41a', marginLeft: 8 }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            <Tag style={{ marginTop: 8 }}>{question.level}</Tag>
                          </Card>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className={styles.videoPlaceholder}>
                <PlayCircleOutlined className={styles.placeholderIcon} />
                <Text>Chọn một ngày học để xem nội dung</Text>
              </div>
            )}
          </Card>

          {/* Course Info */}
          <Card className={styles.infoCard} style={{ marginTop: 24 }}>
            <Title level={3}>Giới thiệu lộ trình học tập</Title>
            <Paragraph>
              Lộ trình học tập được tạo bởi AI dựa trên mục tiêu và trình độ của bạn. 
              Mỗi ngày học bao gồm video bài giảng, lý thuyết và câu hỏi ôn tập để giúp bạn nắm vững kiến thức.
            </Paragraph>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Trình độ: </Text>
                <Text>{getLevelText(learningPath.level)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Tổng số ngày: </Text>
                <Text>{learningPath.totalDays} ngày</Text>
              </Col>
              <Col span={12}>
                <Text strong>Thời lượng: </Text>
                <Text>{learningPath.estimatedHours} giờ học</Text>
              </Col>
              <Col span={12}>
                <Text strong>Tiến độ: </Text>
                <Text>{learningPath.progressPercentage}%</Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column - Days List */}
        <Col xs={24} lg={8}>
          {/* Progress Section */}
          <Card style={{ marginBottom: 24, borderRadius: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>
                    Tiến độ tổng thể
                  </Text>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                    {learningPath.progressPercentage}% Hoàn thành
                  </Title>
                </div>
                <Badge
                  count={`${learningPath.completedDays?.length || 0}/${learningPath.totalDays} Ngày`}
                  style={{ backgroundColor: '#1890ff', fontSize: 14, fontWeight: 600, padding: '4px 12px', borderRadius: 16 }}
                />
              </div>
              <Progress
                percent={learningPath.progressPercentage}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ marginTop: 16 }}
              />
            </div>
          </Card>

          {/* Days List */}
          <Card className={styles.lessonsCard}>
            <Title level={4}>
              <BookOutlined /> Danh sách ngày học
            </Title>
            <Text type="secondary">
              {learningPath.totalDays} ngày học
            </Text>

            {learningPath.learning_path && learningPath.learning_path.length === 0 ? (
              <Empty description="Chưa có ngày học nào" style={{ marginTop: 24 }} />
            ) : (
              <div className={styles.lessonsList} style={{ marginTop: 16 }}>
                {learningPath.learning_path?.map((day) => {
                  const dayCompleted = isDayCompleted(day.day);
                  const dayCurrent = isDayCurrent(day.day);
                  const isViewing = selectedDay?.day === day.day;

                  return (
                    <div
                      key={day.day}
                      className={`${styles.lessonItem} ${isViewing ? styles.active : ''} ${isViewing ? styles.currentLesson : ''}`}
                      onClick={() => handleDayClick(day)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.lessonContent}>
                        <Space size="middle">
                          {dayCompleted ? (
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                          ) : dayCurrent ? (
                            <PlayCircleOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                          ) : (
                            <PlayCircleOutlined style={{ color: '#d9d9d9', fontSize: '18px' }} />
                          )}
                          <div className={styles.lessonInfo}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Text
                                strong={isViewing}
                                delete={dayCompleted && !isViewing}
                              >
                                Ngày {day.day}: {day.subskill}
                              </Text>
                              {isViewing && !dayCompleted && (
                                <Tag color="blue" style={{ fontSize: 11 }}>Đang xem</Tag>
                              )}
                              {dayCompleted && (
                                <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                              )}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                              <Tag size="small">{day.skill}</Tag>
                              {day.youtube_links && (
                                <YoutubeOutlined style={{ marginLeft: 8, fontSize: 12 }} />
                              )}
                              {day.theory && (
                                <FileTextOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                              )}
                              {day.question_review && day.question_review.length > 0 && (
                                <QuestionCircleOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                              )}
                            </Text>
                          </div>
                        </Space>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
