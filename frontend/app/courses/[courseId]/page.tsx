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
  Collapse,
  Button,
  Image,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getCourseById, getModulesByCourseId, getLessonsByModuleId } from '@/service/courses';
import type { Course, CourseModule, Lesson } from '@/types/course';
import styles from '@/styles/courseDetail.module.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Helper function to get video URL from lesson content
  const getVideoUrl = (lesson: Lesson): string | null => {
    if (!lesson.content) return null;

    // If content is a string, return it directly
    if (typeof lesson.content === 'string') {
      return lesson.content;
    }

    // If content is an object, check for video_url
    if (typeof lesson.content === 'object' && lesson.content !== null) {
      return lesson.content.video_url || null;
    }

    return null;
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
      setModules(modulesData.sort((a, b) => a.order - b.order));

      // Fetch lessons for each module
      const lessonsMap: Record<string, Lesson[]> = {};
      for (const module of modulesData) {
        const lessons = await getLessonsByModuleId(module._id);
        console.log(`Lessons for module ${module._id}:`, lessons);
        lessonsMap[module._id] = lessons.sort((a, b) => a.order - b.order);
      }
      setLessonsByModule(lessonsMap);

      // Set default video (first video lesson found)
      const allLessons = Object.values(lessonsMap).flat();
      console.log('All lessons:', allLessons);

      const firstVideoLesson = allLessons.find(lesson => {
        if (lesson.type !== 'video') return false;
        const videoUrl = getVideoUrl(lesson);
        console.log(`Lesson ${lesson.title} - video URL:`, videoUrl);
        return !!videoUrl;
      });

      if (firstVideoLesson) {
        const videoUrl = getVideoUrl(firstVideoLesson);
        if (videoUrl) {
          console.log('Setting default video:', videoUrl);
          setSelectedVideo(videoUrl);
          setSelectedLesson(firstVideoLesson);
        }
      } else {
        console.log('No video lesson found');
      }
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
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.type === 'video') {
      const videoUrl = getVideoUrl(lesson);
      if (videoUrl) {
        console.log('Lesson clicked, video URL:', videoUrl);
        setSelectedVideo(videoUrl);
        setSelectedLesson(lesson);
      } else {
        console.log('Lesson clicked but no video URL found:', lesson);
      }
    }
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
        {/* Left Column - Video Player */}
        <Col xs={24} lg={16}>
          <Card className={styles.videoCard}>
            {selectedVideo ? (
              <div className={styles.videoWrapper}>
                {isDirectVideoFile(selectedVideo) ? (
                  <video
                    src={selectedVideo}
                    controls
                    className={styles.videoPlayer}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      console.error('Video URL:', selectedVideo);
                    }}
                  />
                ) : (
                  <iframe
                    src={convertToEmbedUrl(selectedVideo)}
                    title={selectedLesson?.title || 'Video tutorial'}
                    className={styles.videoPlayer}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={(e) => {
                      console.error('Iframe load error:', e);
                      console.error('Video URL:', selectedVideo);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className={styles.videoPlaceholder}>
                <PlayCircleOutlined className={styles.placeholderIcon} />
                <Text>
                  {modules.length === 0
                    ? 'Khóa học chưa có bài học nào'
                    : Object.values(lessonsByModule).flat().length === 0
                      ? 'Chưa có bài học nào trong khóa học này'
                      : 'Chọn một bài học video để xem'}
                </Text>
                {Object.values(lessonsByModule).flat().length > 0 && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    Có {Object.values(lessonsByModule).flat().filter(l => l.type === 'video').length} bài học video
                  </Text>
                )}
              </div>
            )}

            {selectedLesson && (
              <div className={styles.videoInfo}>
                <Title level={4}>{selectedLesson.title}</Title>
                {selectedLesson.description && (
                  <Paragraph>{selectedLesson.description}</Paragraph>
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
        </Col>

        {/* Right Column - Lessons List */}
        <Col xs={24} lg={8}>
          <Card className={styles.lessonsCard}>
            <Title level={4}>
              <BookOutlined /> Danh sách bài học
            </Title>
            <Text type="secondary">
              {modules.length} modules • {Object.values(lessonsByModule).flat().length} bài học
            </Text>

            {modules.length === 0 ? (
              <Empty description="Chưa có bài học nào" style={{ marginTop: 24 }} />
            ) : (
              <Collapse
                defaultActiveKey={modules.map(m => m._id)}
                className={styles.lessonsCollapse}
              >
                {modules.map((module) => (
                  <Panel
                    header={
                      <div className={styles.moduleHeader}>
                        <Text strong>{module.title}</Text>
                        <Text type="secondary">
                          {lessonsByModule[module._id]?.length || 0} bài học
                        </Text>
                      </div>
                    }
                    key={module._id}
                  >
                    {lessonsByModule[module._id]?.length === 0 ? (
                      <Empty description="Chưa có bài học" />
                    ) : (
                      <div className={styles.lessonsList}>
                        {lessonsByModule[module._id].map((lesson) => (
                          <div
                            key={lesson._id}
                            className={`${styles.lessonItem} ${selectedLesson?._id === lesson._id ? styles.active : ''
                              }`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <div className={styles.lessonContent}>
                              <PlayCircleOutlined className={styles.lessonIcon} />
                              <div className={styles.lessonInfo}>
                                <Text strong>{lesson.title}</Text>
                                {lesson.duration && (
                                  <Text type="secondary" className={styles.lessonDuration}>
                                    <ClockCircleOutlined /> {formatDuration(lesson.duration)}
                                  </Text>
                                )}
                              </div>
                            </div>
                            <div className={styles.lessonType}>
                              {lesson.type === 'video' && 'Video'}
                              {lesson.type === 'text' && 'Tài liệu'}
                              {lesson.type === 'quiz' && 'Quiz'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                ))}
              </Collapse>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

