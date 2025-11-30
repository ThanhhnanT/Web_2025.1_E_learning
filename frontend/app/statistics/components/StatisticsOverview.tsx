"use client";

import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  FileTextOutlined, 
  BookOutlined, 
  ThunderboltOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';

interface OverviewProps {
  overview: {
    totalTests: number;
    averageScore: number;
    bestScore: number;
    totalCourses: number;
    activeCourses: number;
    totalFlashcardDecks: number;
    totalWordsLearned: number;
  };
}

export default function StatisticsOverview({ overview }: OverviewProps) {
  return (
    <Card title="Tổng quan thống kê" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Tổng số bài test"
            value={overview.totalTests}
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Điểm trung bình"
            value={overview.averageScore}
            precision={2}
            prefix={<RiseOutlined />}
            suffix="điểm"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Điểm cao nhất"
            value={overview.bestScore}
            prefix={<TrophyOutlined />}
            suffix="điểm"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Khóa học đang học"
            value={overview.activeCourses}
            prefix={<BookOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Tổng khóa học"
            value={overview.totalCourses}
            prefix={<BookOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Flashcard decks"
            value={overview.totalFlashcardDecks}
            prefix={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Statistic
            title="Từ đã học"
            value={overview.totalWordsLearned}
            prefix={<ThunderboltOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );
}

