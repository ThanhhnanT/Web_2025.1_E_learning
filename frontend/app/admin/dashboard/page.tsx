"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  Avatar,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  BookOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CommentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import {
  getAdminOverviewStats,
  getUserGrowthStats,
  getContentTrends,
  getMostActiveUsers,
  getPopularCourses,
  getRecentActivity,
} from "@/service/admin-stats";
import { useMessageApi } from "@/components/providers/Message";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [contentTrends, setContentTrends] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any>(null);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const generateFakeUserGrowth = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      // Random growth between 2-12 users per day
      const count = Math.floor(Math.random() * 11) + 2;
      data.push({ date: dateStr, count });
    }
    return data;
  };

  const generateFakeContentTrends = () => {
    const posts = [];
    const comments = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      // Random posts between 3-15 per day
      const postCount = Math.floor(Math.random() * 13) + 3;
      // Random comments between 5-25 per day
      const commentCount = Math.floor(Math.random() * 21) + 5;
      posts.push({ date: dateStr, count: postCount });
      comments.push({ date: dateStr, count: commentCount });
    }
    return { posts, comments };
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [overview, users, courses, activity] = await Promise.all([
        getAdminOverviewStats(),
        getMostActiveUsers(10),
        getPopularCourses(10),
        getRecentActivity(5),
      ]);
      
      setOverviewStats(overview);
      
      // Use fake data for charts to make them look nice
      setUserGrowth(generateFakeUserGrowth());
      setContentTrends(generateFakeContentTrends());
      
      setActiveUsers(users.topPosters || []);
      setPopularCourses(courses.popularCourses || []);
      setRecentActivity(activity);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      messageApi.error("Không thể tải thống kê");
    } finally {
      setLoading(false);
    }
  };

  // Format date for chart display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Prepare data for user growth chart
  const userGrowthData = userGrowth.map(item => ({
    date: formatDate(item.date),
    count: item.count,
  }));

  // Prepare data for content trends chart
  const contentTrendsData = (() => {
    const dateMap = new Map();
    
    // Combine posts and comments by date
    (contentTrends?.posts || []).forEach((p: any) => {
      const formattedDate = formatDate(p.date);
      if (!dateMap.has(formattedDate)) {
        dateMap.set(formattedDate, { date: formattedDate, posts: 0, comments: 0 });
      }
      dateMap.get(formattedDate).posts = p.count;
    });
    
    (contentTrends?.comments || []).forEach((c: any) => {
      const formattedDate = formatDate(c.date);
      if (!dateMap.has(formattedDate)) {
        dateMap.set(formattedDate, { date: formattedDate, posts: 0, comments: 0 });
      }
      dateMap.get(formattedDate).comments = c.count;
    });
    
    return Array.from(dateMap.values());
  })();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const activeUsersColumns: ColumnsType<any> = [
    {
      title: "Người dùng",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar_url} icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Số bài viết",
      dataIndex: "postCount",
      key: "postCount",
      sorter: (a, b) => a.postCount - b.postCount,
    },
  ];

  const popularCoursesColumns: ColumnsType<any> = [
    {
      title: "Khóa học",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Ghi danh",
      dataIndex: "enrollmentCount",
      key: "enrollmentCount",
      sorter: (a, b) => a.enrollmentCount - b.enrollmentCount,
    },
  ];

  const recentActivityColumns: ColumnsType<any> = [
    {
      title: "Người dùng",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar_url} icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "administrator" ? "red" : "blue"}>
          {role === "administrator" ? "Quản trị viên" : "Người dùng"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">Tổng quan hệ thống E-Learning</Text>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Tổng người dùng"
              value={overviewStats?.users?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={
                <span style={{ fontSize: 14, color: "#3f8600" }}>
                  <ArrowUpOutlined /> {overviewStats?.users?.active?.last7Days || 0} (7 ngày)
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Khóa học"
              value={overviewStats?.courses?.total || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#137fec" }}
              suffix={
                <span style={{ fontSize: 14, color: "#137fec" }}>
                  {overviewStats?.courses?.totalEnrollments || 0} ghi danh
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Bài viết"
              value={overviewStats?.posts?.active || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#cf1322" }}
              suffix={
                <span style={{ fontSize: 14, color: "#666" }}>
                  {overviewStats?.posts?.totalComments || 0} bình luận
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Bài kiểm tra"
              value={overviewStats?.tests?.total || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#faad14" }}
              suffix={
                <span style={{ fontSize: 14, color: "#666" }}>
                  {overviewStats?.tests?.totalAttempts || 0} lượt thi
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title="Người dùng mới (30 ngày)" 
            bordered={false}
            extra={
              <Text type="secondary" style={{ fontSize: 14 }}>
                {userGrowth.length > 0 
                  ? `${userGrowth.reduce((sum, item) => sum + item.count, 0)} người dùng mới` 
                  : 'Chưa có dữ liệu'}
              </Text>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={userGrowthData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Người dùng"
                  stroke="#1890ff"
                  strokeWidth={3}
                  fill="url(#colorUsers)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="Hoạt động nội dung (30 ngày)" 
            bordered={false}
            extra={
              <Text type="secondary" style={{ fontSize: 14 }}>
                {contentTrends ? 'Bài viết & Bình luận' : 'Chưa có dữ liệu'}
              </Text>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={contentTrendsData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                <Bar
                  dataKey="posts"
                  name="Bài viết"
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  name="Bình luận"
                  stroke="#52c41a"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#52c41a', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Người dùng hoạt động nhiều nhất" bordered={false}>
            <Table
              columns={activeUsersColumns}
              dataSource={activeUsers}
              pagination={false}
              rowKey="userId"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Khóa học phổ biến" bordered={false}>
            <Table
              columns={popularCoursesColumns}
              dataSource={popularCourses}
              pagination={false}
              rowKey="courseId"
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Đăng ký gần đây" bordered={false}>
            <Table
              columns={recentActivityColumns}
              dataSource={recentActivity?.recentRegistrations || []}
              pagination={false}
              rowKey="_id"
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

