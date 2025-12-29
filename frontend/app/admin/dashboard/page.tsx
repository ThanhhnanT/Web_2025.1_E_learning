"use client";

import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Segmented,
  Avatar,
} from "antd";
import {
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface OrderData {
  key: string;
  orderId: string;
  customer: string;
  date: string;
  amount: string;
  status: "Shipped" | "Processing" | "Cancelled";
}

interface ProductData {
  key: string;
  name: string;
  sold: string;
  revenue: string;
  image: string;
}

export default function AdminDashboard() {
  const [timePeriod, setTimePeriod] = useState<string>("1M");

  // Mock data for chart
  const chartData = [
    { month: "Jan", sales: 3200 },
    { month: "Feb", sales: 3800 },
    { month: "Mar", sales: 4200 },
    { month: "Apr", sales: 4500 },
    { month: "May", sales: 4800 },
    { month: "Jun", sales: 5200 },
    { month: "Jul", sales: 5600 },
    { month: "Aug", sales: 6100 },
    { month: "Sep", sales: 6500 },
    { month: "Oct", sales: 7200 },
    { month: "Nov", sales: 7800 },
    { month: "Dec", sales: 8500 },
  ];

  const chartConfig = {
    data: chartData,
    xField: "month",
    yField: "sales",
    point: {
      size: 5,
      shape: "circle",
    },
    label: {
      style: {
        fill: "#aaa",
      },
    },
    smooth: true,
    color: "#137fec",
  };

  const orderColumns: ColumnsType<OrderData> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => <Text strong>#{text}</Text>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          Shipped: "green",
          Processing: "orange",
          Cancelled: "red",
        };
        const statusMap: Record<string, string> = {
          Shipped: "Đã giao",
          Processing: "Đang xử lý",
          Cancelled: "Đã hủy",
        };
        return <Tag color={colorMap[status]}>{statusMap[status] || status}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: () => (
        <Button type="link" style={{ padding: 0 }}>
          Xem
        </Button>
      ),
    },
  ];

  const orderData: OrderData[] = [
    {
      key: "1",
      orderId: "12543",
      customer: "John Doe",
      date: "2023-10-27",
      amount: "$150.00",
      status: "Shipped",
    },
    {
      key: "2",
      orderId: "12542",
      customer: "Jane Smith",
      date: "2023-10-27",
      amount: "$45.50",
      status: "Processing",
    },
    {
      key: "3",
      orderId: "12541",
      customer: "Sam Wilson",
      date: "2023-10-26",
      amount: "$299.99",
      status: "Shipped",
    },
    {
      key: "4",
      orderId: "12540",
      customer: "Peter Jones",
      date: "2023-10-25",
      amount: "$89.00",
      status: "Cancelled",
    },
  ];

  const topProducts: ProductData[] = [
    {
      key: "1",
      name: "Giày chạy bộ",
      sold: "1,204 đã bán",
      revenue: "$120,400",
      image: "https://via.placeholder.com/56",
    },
    {
      key: "2",
      name: "Đồng hồ cổ điển",
      sold: "891 đã bán",
      revenue: "$98,010",
      image: "https://via.placeholder.com/56",
    },
    {
      key: "3",
      name: "Tai nghe",
      sold: "742 đã bán",
      revenue: "$74,125",
      image: "https://via.placeholder.com/56",
    },
  ];

  return (
    <div>
      {/* Page Heading */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            Chào mừng trở lại, Admin!
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Đây là tóm tắt các chỉ số quan trọng của bạn.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="large"
          style={{ height: 40 }}
        >
          Xuất dữ liệu
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <Statistic
              title="Tổng doanh thu"
              value={12450}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#101922", fontSize: 30, fontWeight: "bold" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#52c41a", fontSize: 16, fontWeight: 500 }}>
                <ArrowUpOutlined /> +5.2%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <Statistic
              title="Tổng người dùng"
              value={1234}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#101922", fontSize: 30, fontWeight: "bold" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#52c41a", fontSize: 16, fontWeight: 500 }}>
                <ArrowUpOutlined /> +1.8%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <Statistic
              title="Đơn hàng mới (Hôm nay)"
              value={56}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#101922", fontSize: 30, fontWeight: "bold" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#52c41a", fontSize: 16, fontWeight: 500 }}>
                <ArrowUpOutlined /> +10%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <Statistic
              title="Đơn hàng chờ giao"
              value={12}
              prefix={<TruckOutlined />}
              valueStyle={{ color: "#101922", fontSize: 30, fontWeight: "bold" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#ff4d4f", fontSize: 16, fontWeight: 500 }}>
                <ArrowDownOutlined /> -2%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Sales Overview Chart */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Tổng quan doanh số
              </Title>
              <Segmented
                options={["1W", "1M", "1Y"]}
                value={timePeriod}
                onChange={setTimePeriod}
                size="small"
              />
            </div>
            <div style={{ height: 320 }}>
              <Line {...chartConfig} />
            </div>
          </Card>
        </Col>

        {/* Top Products */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <Title level={4} style={{ marginBottom: 24 }}>
              Sản phẩm bán chạy
            </Title>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {topProducts.map((product) => (
                <div
                  key={product.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Avatar
                    shape="square"
                    size={56}
                    src={product.image}
                    style={{ borderRadius: 8 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: "block", marginBottom: 4 }}>
                      {product.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {product.sold}
                    </Text>
                  </div>
                  <Text strong style={{ fontSize: 16 }}>
                    {product.revenue}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Card
        style={{
          marginTop: 32,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <Title level={4} style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
          Đơn hàng gần đây
        </Title>
        <Table
          columns={orderColumns}
          dataSource={orderData}
          pagination={false}
        />
      </Card>
    </div>
  );
}

