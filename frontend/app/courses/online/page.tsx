"use client";

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tabs, Spin, Empty, Image } from 'antd';
import { PlayCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getAllCourses } from '@/service/courses';
import type { Course, CourseTopic } from '@/types/course';
import styles from '@/styles/courses.module.css';
import CourseOnline from '@/components/CourseOnline'

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

export default function CoursesOnlinePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<CourseTopic>('All');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      // Filter only published courses
      const publishedCourses = data.filter(course => course.status === 'published');
      setCourses(publishedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group courses by topic (HSK, TOEIC, IELTS)
  const groupCoursesByTopic = () => {
    const grouped: Record<string, Course[]> = {
      HSK: [],
      TOEIC: [],
      IELTS: [],
      Other: []
    };

    courses.forEach(course => {
      const level = course.level?.toUpperCase() || '';
      const tags = course.tags?.map(tag => tag.toUpperCase()) || [];

      if (level.includes('HSK') || tags.some(tag => tag.includes('HSK'))) {
        grouped.HSK.push(course);
      } else if (level.includes('TOEIC') || tags.some(tag => tag.includes('TOEIC'))) {
        grouped.TOEIC.push(course);
      } else if (level.includes('IELTS') || tags.some(tag => tag.includes('IELTS'))) {
        grouped.IELTS.push(course);
      } else {
        grouped.Other.push(course);
      }
    });

    return grouped;
  };

  const groupedCourses = groupCoursesByTopic();

  const getInstructorName = (course: Course) => {
    return typeof course.instructor === 'string'
      ? 'N/A'
      : course.instructor?.name || 'N/A';
  };

  const getFilteredCourses = () => {
    if (activeTopic === 'All') {
      return courses;
    }
    return groupedCourses[activeTopic] || [];
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const topicItems = [
    {
      key: 'All',
      label: 'Tất cả',
    },
    {
      key: 'HSK',
      label: 'HSK',
    },
    {
      key: 'TOEIC',
      label: 'TOEIC',
    },
    {
      key: 'IELTS',
      label: 'IELTS',
    },
  ];

  const filteredCourses = getFilteredCourses();

  return (
    <>
      <div style={{ marginTop: '24px' }}>
        <CourseOnline />
      </div>
      <div className={styles.coursesContainer}>
        <div className={styles.header}>
          <Title level={1} className={styles.title}>Khóa học trực tuyến</Title>
          <Paragraph className={styles.subtitle}>
            Khám phá các khóa học chất lượng cao được thiết kế để giúp bạn đạt được mục tiêu học tập của mình
          </Paragraph>
        </div>

        <Tabs
          activeKey={activeTopic}
          items={topicItems}
          onChange={(key) => setActiveTopic(key as CourseTopic)}
          className={styles.tabs}
        />

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Empty description="Không có khóa học nào" />
        ) : (
          <Row gutter={[24, 24]} className={styles.coursesGrid}>
            {filteredCourses.map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} key={course._id}>
                <Card
                  hoverable
                  className={styles.courseCard}
                  cover={
                    course.thumbnail_url ? (
                      <div className={styles.thumbnailContainer}>
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          className={styles.thumbnail}
                          preview={false}
                          fallback="/image.png"
                        />
                        <div className={styles.playOverlay}>
                          <PlayCircleOutlined className={styles.playIcon} />
                        </div>
                      </div>
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <BookOutlined className={styles.placeholderIcon} />
                      </div>
                    )
                  }
                  onClick={() => handleCourseClick(course._id)}
                >
                  <Meta
                    title={<Text strong className={styles.courseTitle}>{course.title}</Text>}
                    description={
                      <div className={styles.courseMeta}>
                        <div className={styles.metaItem}>
                          <UserOutlined /> {getInstructorName(course)}
                        </div>
                        <div className={styles.metaItem}>
                          <BookOutlined /> {course.totalModules} modules
                        </div>
                        {course.level && (
                          <div className={styles.levelBadge}>
                            {course.level}
                          </div>
                        )}
                        <div className={styles.price}>
                          {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} VNĐ`}
                        </div>
                      </div>
                    }
                  />
                  {course.description && (
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className={styles.description}
                    >
                      {course.description}
                    </Paragraph>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </>
  );
}

