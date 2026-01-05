"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Collapse,
  Button,
  Image,
  Divider,
  Progress,
  Space,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { getCourseById, getModulesByCourseId, getLessonsByModuleId } from '@/service/courses';
import type { Course, CourseModule, Lesson } from '@/types/course';
import {
  getCourseProgress,
  getCompletedModulesCount,
  getModuleProgress,
  isModuleCompleted,
  isModuleInProgress,
  isModuleLocked,
  isLessonCompleted,
  isLessonLocked,
  getCurrentLesson,
} from '@/lib/courseProgress';
import VideoPlayer from '@/components/VideoPlayer';
import CourseReviewSection from '@/components/CourseReviewSection';
import LessonContentRenderer from '@/components/LessonContentRenderer';
import styles from '@/styles/courseDetail.module.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Helper function to get video URL from lesson content
  // Priority: 1. Direct video file (cloud storage), 2. YouTube/Vimeo
  const getVideoUrl = (lesson: Lesson): string | null => {
    if (!lesson.content) return null;

    let videoUrl: string | null = null;

    // If content is a string, use it directly
    if (typeof lesson.content === 'string') {
      videoUrl = lesson.content;
    }
    // If content is an object, check for video_url
    else if (typeof lesson.content === 'object' && lesson.content !== null) {
      videoUrl = lesson.content.video_url || null;
    }

    if (!videoUrl) return null;

    // Priority: Direct video files first, then YouTube/Vimeo
    // If it's a direct video file, return it
    if (isDirectVideoFile(videoUrl)) {
      return videoUrl;
    }

    // If it's YouTube/Vimeo, return it
    if (isYouTubeOrVimeo(videoUrl)) {
      return videoUrl;
    }

    // Default: return the URL (might be a direct file without extension)
    return videoUrl;
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseData = await getCourseById(courseId);
      if (!courseData) {
        console.log('No course data found for courseId:', courseId);
        return;
      }
      setCourse(courseData);
      console.log('Course data:', courseData);

      // Fetch modules for this course
      const modulesData = await getModulesByCourseId(courseId);
      console.log('Modules data:', modulesData);
      console.log('Modules count:', modulesData?.length || 0);
      const sortedModules = (modulesData || []).sort((a, b) => a.order - b.order);
      setModules(sortedModules);
      console.log('Sorted modules:', sortedModules);

      // Fetch lessons for each module
      const lessonsMap: Record<string, Lesson[]> = {};
      for (const module of sortedModules) {
        const lessons = await getLessonsByModuleId(module._id);
        console.log(`Lessons for module ${module._id}:`, lessons);
        lessonsMap[module._id] = lessons.sort((a, b) => a.order - b.order);
      }
      setLessonsByModule(lessonsMap);

      // Determine which modules to expand
      let modulesToExpand: string[] = [];

      // Check if there's a lessonId in URL params
      const lessonIdFromUrl = searchParams?.get('lessonId');
      if (lessonIdFromUrl) {
        const allLessons = Object.values(lessonsMap).flat();
        const lesson = allLessons.find(l => l._id === lessonIdFromUrl);
        if (lesson) {
          setSelectedLesson(lesson);
          // Set video URL only if it's a video lesson
          if (lesson.type === 'video') {
            const videoUrl = getVideoUrl(lesson);
            setSelectedVideo(videoUrl);
          } else {
            setSelectedVideo(null);
          }
          // Expand the module containing this lesson
          const module = sortedModules.find(m => lessonsMap[m._id]?.some(l => l._id === lessonIdFromUrl));
          if (module) {
            modulesToExpand = [module._id];
          }
        }
      } else {
        // Set default lesson (any type) - prefer current lesson from progress, then first lesson
        const allLessons = Object.values(lessonsMap).flat();
        console.log('All lessons:', allLessons);

        // Try to get current lesson from progress
        const currentLesson = getCurrentLesson(sortedModules, lessonsMap, courseId);
        if (currentLesson) {
          setSelectedLesson(currentLesson.lesson);
          // Set video URL only if it's a video lesson
          if (currentLesson.lesson.type === 'video') {
            const videoUrl = getVideoUrl(currentLesson.lesson);
            setSelectedVideo(videoUrl);
          } else {
            setSelectedVideo(null);
          }
          modulesToExpand = [currentLesson.module._id];
        } else {
          // Fallback to first lesson (any type)
          const firstLesson = allLessons[0];
          if (firstLesson) {
            setSelectedLesson(firstLesson);
            // Set video URL only if it's a video lesson
            if (firstLesson.type === 'video') {
              const videoUrl = getVideoUrl(firstLesson);
              setSelectedVideo(videoUrl);
            } else {
              setSelectedVideo(null);
            }
          }
        }
      }

      // Auto-expand all modules by default if no specific module was selected
      if (modulesToExpand.length === 0 && sortedModules.length > 0) {
        modulesToExpand = sortedModules.map((m: CourseModule) => m._id);
      }
      
      setExpandedModules(modulesToExpand);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
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

    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    return url;
  };

  const isDirectVideoFile = (url: string): boolean => {
    // Check if URL is a direct video file (mp4, webm, ogg, mov, m3u8, etc.)
    // Also check if it's a cloud storage URL (like Cloudinary, AWS S3, etc.)
    const videoFileExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m3u8)$/i;
    const cloudStoragePatterns = [
      /cloudinary\.com/i,
      /amazonaws\.com/i,
      /s3\./i,
      /storage\.googleapis\.com/i,
      /blob\.core\.windows\.net/i,
      /\.mp4\?/i, // URL with query params ending in .mp4
      /\.webm\?/i,
    ];
    
    return videoFileExtensions.test(url) || cloudStoragePatterns.some(pattern => pattern.test(url));
  };

  const isYouTubeOrVimeo = (url: string): boolean => {
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
  };

  const handleLessonClick = (lesson: Lesson, module: CourseModule) => {
    if (isLessonLocked(lesson, lessonsByModule[module._id] || [], courseId, module)) {
      return; // Don't navigate if locked
    }
    
    // Select lesson and update URL
    setSelectedLesson(lesson);
    
    // For video lessons, also set video URL
    if (lesson.type === 'video') {
      const videoUrl = getVideoUrl(lesson);
      if (videoUrl) {
        setSelectedVideo(videoUrl);
      } else {
        setSelectedVideo(null);
      }
    } else {
      // For text and quiz lessons, clear video
      setSelectedVideo(null);
    }
    
    // Update URL without reload
    router.push(`/courses/${courseId}?lessonId=${lesson._id}`, { scroll: false });
  };

  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return <PlayCircleOutlined />;
      case 'text':
        return <FileTextOutlined />;
      case 'quiz':
        return <QuestionCircleOutlined />;
      default:
        return <PlayCircleOutlined />;
    }
  };

  const getModuleStatusIcon = (module: CourseModule, lessons: Lesson[]) => {
    if (isModuleLocked(module, modules, lessonsByModule, courseId)) {
      return <LockOutlined style={{ color: '#d9d9d9', fontSize: '18px' }} />;
    }
    if (isModuleCompleted(module._id, lessons, courseId)) {
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
    }
    if (isModuleInProgress(module._id, lessons, courseId)) {
      const progress = getModuleProgress(module._id, lessons, courseId);
      const completedCount = lessons.filter(l => isLessonCompleted(courseId, l._id)).length;
      return (
        <Progress
          type="circle"
          percent={progress}
          size={32}
          strokeWidth={8}
          format={() => `${completedCount}/${lessons.length}`}
          showInfo={true}
        />
      );
    }
    return null;
  };

  const getCurrentLessonInModule = (module: CourseModule, lessons: Lesson[]): Lesson | null => {
    const completedLessonIds = lessons.filter(l => isLessonCompleted(courseId, l._id)).map(l => l._id);
    return lessons.find(l => !completedLessonIds.includes(l._id)) || null;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getInstructorName = () => {
    if (!course?.instructor) return 'N/A';
    return typeof course.instructor === 'string'
      ? 'N/A'
      : course.instructor.name || 'N/A';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.container}>
        <Empty description="Khóa học không tồn tại" />
        <Button onClick={() => router.push('/courses')} style={{ marginTop: 16 }}>
          Quay lại danh sách khóa học
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/courses')}
        className={styles.backButton}
      >
        Quay lại
      </Button>

      <Row gutter={[24, 24]}>
        {/* Left Column - Lesson Content */}
        <Col xs={24} lg={16}>
          <Card className={styles.videoCard}>
            {selectedLesson ? (
              <>
                {/* Lesson Header */}
                <div className={styles.videoInfo}>
                  <Title level={4}>{selectedLesson.title}</Title>
                  {selectedLesson.description && (
                    <Paragraph>{selectedLesson.description}</Paragraph>
                  )}
                  {selectedLesson.duration && (
                    <Text type="secondary">
                      <ClockCircleOutlined /> {formatDuration(selectedLesson.duration)}
                    </Text>
                  )}
                </div>

                <Divider />

                {/* Lesson Content based on type */}
                <LessonContentRenderer lesson={selectedLesson} />
              </>
            ) : (
              <div className={styles.videoPlaceholder}>
                <PlayCircleOutlined className={styles.placeholderIcon} />
                <Text>
                  {modules.length === 0
                    ? 'Khóa học chưa có bài học nào'
                    : Object.values(lessonsByModule).flat().length === 0
                      ? 'Chưa có bài học nào trong khóa học này'
                      : 'Chọn một bài học để xem'}
                </Text>
                {Object.values(lessonsByModule).flat().length > 0 && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    {Object.values(lessonsByModule).flat().filter(l => l.type === 'video').length} video •{' '}
                    {Object.values(lessonsByModule).flat().filter(l => l.type === 'text').length} tài liệu •{' '}
                    {Object.values(lessonsByModule).flat().filter(l => l.type === 'quiz').length} quiz
                  </Text>
                )}
              </div>
            )}
          </Card>

          {/* Course Info */}
          <Card className={styles.infoCard} style={{ marginTop: 24 }}>
            <Title level={3}>Giới thiệu khóa học</Title>
            <Paragraph>{course.description || 'Khóa học này chưa có mô tả.'}</Paragraph>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Giảng viên: </Text>
                <Text>{getInstructorName()}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Ngôn ngữ: </Text>
                <Text>{course.language}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Trình độ: </Text>
                <Text>{course.level}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Giá: </Text>
                <Text>{course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} VNĐ`}</Text>
              </Col>
            </Row>
          </Card>

          {/* Reviews Section */}
          <div style={{ marginTop: 24 }}>
            <CourseReviewSection courseId={courseId} />
          </div>
        </Col>

        {/* Right Column - Lessons List */}
        <Col xs={24} lg={8}>
          {/* Progress Section */}
          {modules.length > 0 && (
            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <div>
                    <Text style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>
                      Tiến độ tổng thể
                    </Text>
                    <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                      {getCourseProgress(courseId, modules, lessonsByModule)}% Hoàn thành
                    </Title>
                  </div>
                  <Badge
                    count={`${getCompletedModulesCount(modules, lessonsByModule, courseId)}/${modules.length} Modules`}
                    style={{ backgroundColor: '#1890ff', fontSize: 14, fontWeight: 600, padding: '4px 12px', borderRadius: 16 }}
                  />
                </div>
                <Progress
                  percent={getCourseProgress(courseId, modules, lessonsByModule)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ marginTop: 16 }}
                />
              </div>
            </Card>
          )}

          <Card className={styles.lessonsCard}>
            <Title level={4}>
              <BookOutlined /> Danh sách bài học
            </Title>
            <Text type="secondary">
              {modules.length} modules • {Object.values(lessonsByModule).flat().length} bài học
            </Text>

            {modules.length === 0 ? (
              <Empty description="Chưa có module nào" style={{ marginTop: 24 }} />
            ) : (
              <Collapse
                activeKey={expandedModules.length > 0 ? expandedModules : modules.map(m => m._id)}
                onChange={(keys) => setExpandedModules(keys as string[])}
                className={styles.lessonsCollapse}
              >
                {modules.map((module) => {
                  const lessons = lessonsByModule[module._id] || [];
                  const isLocked = isModuleLocked(module, modules, lessonsByModule, courseId);
                  const currentLessonInModule = getCurrentLessonInModule(module, lessons);

                  const panelHeader = (
                    <div className={styles.moduleHeader}>
                      <Space size="middle">
                        {getModuleStatusIcon(module, lessons)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text strong={!isLocked} style={isLocked ? { color: 'rgba(0,0,0,0.45)' } : {}}>
                            {module.title}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {isModuleCompleted(module._id, lessons, courseId)
                              ? `Hoàn thành • ${lessons.length} Bài học`
                              : isModuleInProgress(module._id, lessons, courseId)
                              ? `Đang học • ${lessons.length} Bài học`
                              : isLocked
                              ? `Đã khóa • ${lessons.length} Bài học`
                              : `${lessons.length} Bài học`}
                          </Text>
                        </div>
                      </Space>
                    </div>
                  );

                  return (
                    <Panel
                      key={module._id}
                      header={panelHeader}
                      disabled={isLocked}
                    >
                      {lessons.length === 0 ? (
                        <Empty description="Chưa có bài học" />
                      ) : (
                        <div className={styles.lessonsList}>
                          {lessons.map((lesson) => {
                            const lessonCompleted = isLessonCompleted(courseId, lesson._id);
                            const lessonLocked = isLessonLocked(lesson, lessons, courseId, module);
                            const isCurrent = currentLessonInModule?._id === lesson._id && !lessonCompleted;

                            return (
                              <div
                                key={lesson._id}
                                className={`${styles.lessonItem} ${selectedLesson?._id === lesson._id ? styles.active : ''} ${isCurrent ? styles.currentLesson : ''} ${lessonLocked ? styles.lockedLesson : ''}`}
                                onClick={() => !lessonLocked && handleLessonClick(lesson, module)}
                                style={lessonLocked ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                              >
                                <div className={styles.lessonContent}>
                                  <Space size="middle">
                                    {getLessonIcon(lesson)}
                                    <div className={styles.lessonInfo}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text
                                          strong={isCurrent || selectedLesson?._id === lesson._id}
                                          style={lessonLocked ? { color: 'rgba(0,0,0,0.45)' } : {}}
                                          delete={lessonCompleted && !isCurrent}
                                        >
                                          {lesson.title}
                                        </Text>
                                        {isCurrent && (
                                          <Badge
                                            count="HIỆN TẠI"
                                            style={{ backgroundColor: '#1890ff' }}
                                          />
                                        )}
                                      </div>
                                      <Text type="secondary" className={styles.lessonDuration} style={{ fontSize: 12 }}>
                                        {lesson.type === 'video' ? 'Video' : lesson.type === 'text' ? 'Reading' : 'Quiz'}
                                        {lesson.duration && ` • ${formatDuration(lesson.duration)}`}
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {lessonCompleted ? (
                                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                                  ) : lessonLocked ? (
                                    <LockOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </Collapse>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

