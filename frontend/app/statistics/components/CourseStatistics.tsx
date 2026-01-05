"use client";

import React from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag } from 'antd';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface CourseStatsProps {
  courseStats: {
    enrolled: number;
    completed: number;
    inProgress: number;
    courses: any[];
  };
}

export default function CourseStatistics({ courseStats }: CourseStatsProps) {
  const router = useRouter();

  return (
    <Card title="Thống kê khóa học" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Đã đăng ký"
            value={courseStats.enrolled}
            prefix={<BookOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Đang học"
            value={courseStats.inProgress}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Đã hoàn thành"
            value={courseStats.completed}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
      </Row>

      {courseStats.courses.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={courseStats.courses}
          renderItem={(item: any) => {
            const course = item.course || item;
            return (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/courses`)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={course?.thumbnail_url || course?.avatar}
                      icon={<BookOutlined />}
                    />
                  }
                  title={course?.title || 'Khóa học'}
                  description={
                    <div>
                      <div>{course?.description || course?.language || ''}</div>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="blue">{course?.level || ''}</Tag>
                        <Tag color="green">{course?.language || ''}</Tag>
                      </div>
                    </div>
                  }
                />
                <div>
                  <Tag color="success">Đã thanh toán</Tag>
                </div>
              </List.Item>
            );
          }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          Chưa đăng ký khóa học nào
        </div>
      )}
    </Card>
  );
}

