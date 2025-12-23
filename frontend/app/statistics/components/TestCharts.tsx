"use client";

import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Empty } from 'antd';
import { Line, Column, Pie } from '@ant-design/charts';

const { Title } = Typography;

interface TestResult {
  _id: string;
  score: number;
  bandScore?: number;
  completedAt: string | Date;
  testId: {
    _id: string;
    title: string;
    language?: string;
    level?: string;
  };
}

interface TestChartsProps {
  data: TestResult[];
  loading?: boolean;
}

export default function TestCharts({ data, loading = false }: TestChartsProps) {
  // Process data for score progression chart (line chart)
  const scoreProgressionData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item) => ({
      date: new Date(item.completedAt).toLocaleDateString('vi-VN'),
      dateValue: new Date(item.completedAt).getTime(),
      score: item.score,
      bandScore: item.bandScore,
      testTitle: item.testId?.title || 'N/A',
    })).sort((a, b) => a.dateValue - b.dateValue).map((item, index) => ({
      ...item,
      index: index + 1,
    }));
  }, [data]);

  // Process data for daily test count chart
  const dailyTestCountData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const dailyCounts: { [key: string]: { count: number; dateValue: number } } = {};
    
    data.forEach((item) => {
      const dateObj = new Date(item.completedAt);
      const dateKey = dateObj.toLocaleDateString('vi-VN');
      const dateValue = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
      
      if (!dailyCounts[dateKey]) {
        dailyCounts[dateKey] = { count: 0, dateValue };
      }
      dailyCounts[dateKey].count++;
    });

    return Object.entries(dailyCounts)
      .map(([date, { count, dateValue }]) => ({
        date,
        dateValue,
        count,
      }))
      .sort((a, b) => a.dateValue - b.dateValue);
  }, [data]);

  // Process data for score distribution (histogram)
  const scoreDistributionData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const scoreRanges: { [key: string]: number } = {
      '0-1': 0,
      '1-2': 0,
      '2-3': 0,
      '3-4': 0,
      '4-5': 0,
      '5-6': 0,
      '6-7': 0,
      '7-8': 0,
      '8-9': 0,
      '9-10': 0,
    };

    data.forEach((item) => {
      const score = item.score;
      if (score < 1) scoreRanges['0-1']++;
      else if (score < 2) scoreRanges['1-2']++;
      else if (score < 3) scoreRanges['2-3']++;
      else if (score < 4) scoreRanges['3-4']++;
      else if (score < 5) scoreRanges['4-5']++;
      else if (score < 6) scoreRanges['5-6']++;
      else if (score < 7) scoreRanges['6-7']++;
      else if (score < 8) scoreRanges['7-8']++;
      else if (score < 9) scoreRanges['8-9']++;
      else scoreRanges['9-10']++;
    });

    return Object.entries(scoreRanges)
      .filter(([_, count]) => count > 0)
      .map(([range, count]) => ({
        range,
        count,
      }));
  }, [data]);

  // Process data for tests by language
  const languageData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const languageCounts: { [key: string]: number } = {};
    
    data.forEach((item) => {
      const language = item.testId?.language || 'Không xác định';
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    });

    return Object.entries(languageCounts).map(([language, count]) => ({
      type: language,
      value: count,
    }));
  }, [data]);

  // Process data for tests by level
  const levelData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const levelCounts: { [key: string]: number } = {};
    
    data.forEach((item) => {
      const level = item.testId?.level || 'Không xác định';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    return Object.entries(levelCounts).map(([level, count]) => ({
      type: level,
      value: count,
    }));
  }, [data]);

  // Chart configurations
  const scoreProgressionConfig = {
    data: scoreProgressionData,
    xField: 'index',
    yField: 'score',
    point: {
      size: 5,
      shape: 'circle',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    smooth: true,
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: `Bài test ${datum.index}`,
          value: `${datum.score} điểm`,
        };
      },
    },
    loading,
  };

  const dailyTestCountConfig = {
    data: dailyTestCountData,
    xField: 'date',
    yField: 'count',
    columnWidthRatio: 0.6,
    label: {
      position: 'top' as const,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Số bài test',
          value: `${datum.count} bài`,
        };
      },
    },
    loading,
  };

  const scoreDistributionConfig = {
    data: scoreDistributionData,
    binField: 'range',
    binWidth: 1,
    columnStyle: {
      fill: '#1890ff',
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Khoảng điểm',
          value: `${datum.count} bài test`,
        };
      },
    },
    loading,
  };

  const languagePieConfig = {
    data: languageData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name}: {percentage}',
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: `${datum.value} bài test`,
        };
      },
    },
    loading,
  };

  const levelPieConfig = {
    data: levelData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name}: {percentage}',
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: `${datum.value} bài test`,
        };
      },
    },
    loading,
  };

  if (loading) {
    return (
      <Card title="Biểu đồ thống kê" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          Đang tải dữ liệu...
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Biểu đồ thống kê" style={{ marginBottom: 24 }}>
        <Empty description="Không có dữ liệu để hiển thị biểu đồ" />
      </Card>
    );
  }

  return (
    <Card title="Biểu đồ thống kê" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 24]}>
        {/* Score Progression Chart */}
        <Col xs={24} lg={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Tiến trình điểm số</Title>
            {scoreProgressionData.length > 0 ? (
              <Line {...scoreProgressionConfig} height={300} />
            ) : (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Daily Test Count Chart */}
        <Col xs={24} lg={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Số bài test theo ngày</Title>
            {dailyTestCountData.length > 0 ? (
              <Column {...dailyTestCountConfig} height={300} />
            ) : (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Score Distribution Chart */}
        <Col xs={24} lg={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Phân bố điểm số</Title>
            {scoreDistributionData.length > 0 ? (
              <Line 
                data={scoreDistributionData}
                xField="range"
                yField="count"
                point={{
                  size: 5,
                  shape: 'circle',
                }}
                smooth={true}
                tooltip={{
                  formatter: (datum: any) => {
                    return {
                      name: 'Khoảng điểm',
                      value: `${datum.count} bài test`,
                    };
                  },
                }}
                height={300}
              />
            ) : (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Tests by Language Chart */}
        <Col xs={24} lg={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Phân bố theo ngôn ngữ</Title>
            {languageData.length > 0 ? (
              <Pie {...languagePieConfig} height={300} />
            ) : (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Tests by Level Chart */}
        <Col xs={24} lg={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Phân bố theo cấp độ</Title>
            {levelData.length > 0 ? (
              <Pie {...levelPieConfig} height={300} />
            ) : (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

