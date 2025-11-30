"use client";

import React from 'react';
import { Card, Table, Tag, Typography, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

interface TestStatsProps {
  testStats: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    byLanguage: { [key: string]: number };
    byLevel: { [key: string]: number };
    recentResults: any[];
  };
}

export default function TestStatistics({ testStats }: TestStatsProps) {
  const router = useRouter();

  const columns = [
    {
      title: 'Bài test',
      dataIndex: 'testId',
      key: 'testId',
      render: (testId: any) => {
        if (typeof testId === 'object' && testId?.title) {
          return testId.title;
        }
        return 'N/A';
      },
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => `${score} điểm`,
    },
    {
      title: 'Band Score',
      dataIndex: 'bandScore',
      key: 'bandScore',
      render: (bandScore: number | undefined) => 
        bandScore ? `${bandScore}` : '-',
    },
    {
      title: 'Đúng',
      dataIndex: 'correctAnswers',
      key: 'correctAnswers',
      render: (correct: number, record: any) => 
        `${correct}/${record.totalQuestions}`,
    },
    {
      title: 'Thời gian',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      render: (time: number) => `${time} phút`,
    },
    {
      title: 'Ngày làm',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <a onClick={() => router.push(`/tests/${record.testId?._id || record.testId}/results/${record._id}`)}>
          Xem chi tiết
        </a>
      ),
    },
  ];

  return (
    <Card title="Thống kê bài test" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Tổng số lần làm"
            value={testStats.totalAttempts}
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Điểm trung bình"
            value={testStats.averageScore}
            precision={2}
            prefix={<RiseOutlined />}
            suffix="điểm"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Điểm cao nhất"
            value={testStats.bestScore}
            prefix={<TrophyOutlined />}
            suffix="điểm"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Điểm thấp nhất"
            value={testStats.worstScore}
            prefix={<FallOutlined />}
            suffix="điểm"
          />
        </Col>
      </Row>

      {Object.keys(testStats.byLanguage).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Theo ngôn ngữ:</Title>
          <div>
            {Object.entries(testStats.byLanguage).map(([lang, count]) => (
              <Tag key={lang} color="blue" style={{ marginBottom: 8 }}>
                {lang}: {count} bài
              </Tag>
            ))}
          </div>
        </div>
      )}

      {Object.keys(testStats.byLevel).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Theo level:</Title>
          <div>
            {Object.entries(testStats.byLevel).map(([level, count]) => (
              <Tag key={level} color="green" style={{ marginBottom: 8 }}>
                {level}: {count} bài
              </Tag>
            ))}
          </div>
        </div>
      )}

      <Title level={5}>Kết quả gần đây:</Title>
      <Table
        columns={columns}
        dataSource={testStats.recentResults}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: 'Chưa có kết quả nào' }}
      />
    </Card>
  );
}

