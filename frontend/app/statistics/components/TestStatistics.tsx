"use client";

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Statistic, Select, DatePicker, Space, Spin, message } from 'antd';
import { FileTextOutlined, TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getTestChartData } from '@/service/statistics';
import { getUserId } from '@/lib/helper';
import TestCharts from './TestCharts';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const fetchChartData = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoadingCharts(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateRangeType === 'custom') {
        if (customDateRange[0] && customDateRange[1]) {
          startDate = customDateRange[0].startOf('day').toISOString();
          endDate = customDateRange[1].endOf('day').toISOString();
        } else {
          setLoadingCharts(false);
          return;
        }
      } else if (dateRangeType !== 'all') {
        const days = parseInt(dateRangeType);
        const end = dayjs();
        const start = end.subtract(days, 'day');
        startDate = start.startOf('day').toISOString();
        endDate = end.endOf('day').toISOString();
      }

      const data = await getTestChartData(userId, startDate, endDate);
      setChartData(data.results || []);
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
      message.error('Không thể tải dữ liệu biểu đồ');
      setChartData([]);
    } finally {
      setLoadingCharts(false);
    }
  };

  const handleDateRangeChange = (value: string) => {
    setDateRangeType(value);
    if (value !== 'custom') {
      setCustomDateRange([null, null]);
    }
  };

  const handleCustomDateRangeChange = (dates: any) => {
    setCustomDateRange(dates);
  };

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeType, customDateRange]);

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

      {/* Date Range Selector and Charts */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>Khoảng thời gian:</Title>
            <Space wrap>
              <Select
                value={dateRangeType}
                onChange={handleDateRangeChange}
                style={{ width: 200 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="7">7 ngày qua</Option>
                <Option value="30">30 ngày qua</Option>
                <Option value="90">90 ngày qua</Option>
                <Option value="custom">Tùy chọn</Option>
              </Select>
              {dateRangeType === 'custom' && (
                <RangePicker
                  value={customDateRange}
                  onChange={handleCustomDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              )}
            </Space>
          </div>
        </Space>
      </div>

      {/* Charts */}
      <TestCharts data={chartData} loading={loadingCharts} />

      <Title level={5} style={{ marginTop: 24 }}>Kết quả gần đây:</Title>
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

