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
import { Line, Column } from "@ant-design/charts";
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

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [overview, growth, trends, users, courses, activity] = await Promise.all([
        getAdminOverviewStats(),
        getUserGrowthStats(30),
        getContentTrends(30),
        getMostActiveUsers(10),
        getPopularCourses(10),
        getRecentActivity(5),
      ]);
      
      setOverviewStats(overview);
      setUserGrowth(growth.data || []);
      setContentTrends(trends);
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

  const userGrowthChartConfig = {
    data: userGrowth,
    xField: "date",
    yField: "count",
    point: {
      size: 5,
      shape: "circle",
    },
    smooth: true,
    color: "#137fec",
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
  };

  const contentTrendsChartConfig = {
    data: [
      ...(contentTrends?.posts || []).map((p: any) => ({ date: p.date, value: p.count, type: "Bài viết" })),
      ...(contentTrends?.comments || []).map((c: any) => ({ date: c.date, value: c.count, type: "Bình luận" })),
    ],
    xField: "date",
    yField: "value",
    seriesField: "type",
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
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
          {role === "administrator" ? "Quản trị viên" : "Người xem"}
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
          <Card title="Người dùng mới (30 ngày)" bordered={false}>
            <Line {...userGrowthChartConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động nội dung (30 ngày)" bordered={false}>
            <Line {...contentTrendsChartConfig} />
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

