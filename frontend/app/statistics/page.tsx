"use client";

import React, { useState, useEffect } from 'react';
import { Spin, message, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { getUserStatistics } from '@/service/statistics';
import { getUserId } from '@/lib/helper';
import StatisticsOverview from './components/StatisticsOverview';
import TestStatistics from './components/TestStatistics';
import CourseStatistics from './components/CourseStatistics';
import FlashcardStatistics from './components/FlashcardStatistics';
import { useMessageApi } from '@/components/providers/Message';
import Cookies from 'js-cookie';

const { Title } = Typography;

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const router = useRouter();
  const messageApi = useMessageApi();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          messageApi.error('Vui lòng đăng nhập để xem thống kê');
          router.push('/auth/login');
          return;
        }

        const userId = getUserId();
        if (!userId) {
          messageApi.error('Không thể lấy thông tin người dùng');
          router.push('/auth/login');
          return;
        }

        const data = await getUserStatistics(userId);
        setStatistics(data);
      } catch (error: any) {
        console.error('Error fetching statistics:', error);
        if (error?.response?.status === 401) {
          messageApi.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          router.push('/auth/login');
        } else {
          messageApi.error('Không thể tải thống kê. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [router, messageApi]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Title level={4}>Không có dữ liệu thống kê</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Thống kê học tập</Title>
      
      <StatisticsOverview overview={statistics.overview} />
      <TestStatistics testStats={statistics.testStats} />
      <CourseStatistics courseStats={statistics.courseStats} />
      <FlashcardStatistics flashcardStats={statistics.flashcardStats} />
    </div>
  );
}

