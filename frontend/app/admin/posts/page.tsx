"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  Modal,
  Form,
  Popconfirm,
  Spin,
  Row,
  Col,
  Statistic,
  Image,
  Tooltip,
  Checkbox,
  message,
} from "antd";
import { useMessageApi } from "@/components/providers/Message";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  FilterOutlined,
  CheckOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { getPosts, deletePost, updatePost, updatePostStatus, type Post as ApiPost } from "@/service/posts";
import { getUserProfile } from "@/helper/api";
import { getAdminRole } from "@/lib/adminHelper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Post {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  deletedAt?: string | null;
  status?: 'active' | 'pending' | 'reported' | 'archived';
}

export default function PostsManagementPage() {
  const messageApi = useMessageApi();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [editForm] = Form.useForm();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    reported: 0,
    total: 0,
  });

  const convertApiPostToPost = (apiPost: ApiPost): Post => {
    const user = apiPost.user || {};
    return {
      id: apiPost.id || (apiPost as any)._id?.toString() || '',
      user: {
        id: user.id || (user as any)._id?.toString() || '',
        name: user.name || 'Unknown User',
        avatar_url: user.avatar_url || (user as { avatar?: string }).avatar || '',
      },
      content: apiPost.content || '',
      imageUrl: apiPost.imageUrl,
      createdAt: apiPost.createdAt || new Date().toISOString(),
      updatedAt: apiPost.updatedAt || new Date().toISOString(),
      likes: apiPost.likes || 0,
      commentsCount: apiPost.commentsCount || 0,
      deletedAt: (apiPost as any).deletedAt || null,
      status: (apiPost as any).deletedAt ? 'archived' : ((apiPost as any).status || 'active'),
    };
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPosts({
        page: pagination.current,
        limit: pagination.pageSize,
      });
      
      let convertedPosts = response.data.map(convertApiPostToPost);
      
      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        convertedPosts = convertedPosts.filter(
          (post) =>
            post.content.toLowerCase().includes(searchLower) ||
            post.user.name.toLowerCase().includes(searchLower) ||
            post.id.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by status
      if (statusFilter !== "all") {
        convertedPosts = convertedPosts.filter((post) => post.status === statusFilter);
      }
      
      setPosts(convertedPosts);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || convertedPosts.length,
      }));

      // Calculate stats
      const allPosts = response.data.map(convertApiPostToPost);
      setStats({
        pending: allPosts.filter((p) => p.status === 'pending').length,
        reported: allPosts.filter((p) => p.status === 'reported').length,
        total: allPosts.filter((p) => p.status === 'active').length,
      });
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tải danh sách bài viết"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  useEffect(() => {
    fetchPosts();
    // Get user role
    getAdminRole().then(setUserRole);
  }, [fetchPosts]);

  const isAdminOrEditor = userRole === 'administrator' || userRole === 'editor';

  const handleTableChange = (newPagination: any) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      messageApi.success("Xóa bài viết thành công");
      fetchPosts();
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message || "Không thể xóa bài viết"
      );
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedRowKeys.map((id) => deletePost(id.toString())));
      messageApi.success(`Đã xóa ${selectedRowKeys.length} bài viết`);
      setSelectedRowKeys([]);
      fetchPosts();
    } catch (error: any) {
      messageApi.error("Không thể xóa các bài viết đã chọn");
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    editForm.setFieldsValue({
      content: post.content,
      imageUrl: post.imageUrl,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingPost) return;
    
    try {
      await updatePost(editingPost.id, { content: values.content, imageUrl: values.imageUrl });
      messageApi.success("Cập nhật bài viết thành công");
      setIsEditModalVisible(false);
      setEditingPost(null);
      editForm.resetFields();
      fetchPosts();
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật bài viết"
      );
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      await updatePostStatus(postId, newStatus);
      messageApi.success("Cập nhật trạng thái thành công");
      fetchPosts();
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    }
  };

  const handleView = (post: Post) => {
    setViewingPost(post);
    setIsViewModalVisible(true);
  };

  const getStatusTag = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Tag icon={<ClockCircleOutlined />} color="orange">
            Chờ xử lý
          </Tag>
        );
      case 'reported':
        return (
          <Tag icon={<FlagOutlined />} color="red">
            Bị báo cáo
          </Tag>
        );
      case 'archived':
        return (
          <Tag color="default">
            Đã lưu trữ
          </Tag>
        );
      default:
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Hoạt động
          </Tag>
        );
    }
  };

  const columns: ColumnsType<Post> = [
    {
      title: (
        <Checkbox
          indeterminate={
            selectedRowKeys.length > 0 && selectedRowKeys.length < posts.length
          }
          checked={
            posts.length > 0 && selectedRowKeys.length === posts.length
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys(posts.map((p) => p.id));
            } else {
              setSelectedRowKeys([]);
            }
          }}
        />
      ),
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.id]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter((id) => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: "Thông tin bài viết",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar
            src={record.user.avatar_url}
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {record.user.name}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: #{record.id.slice(-4)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Nội dung",
      key: "content",
      width: 300,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>
            {record.content.length > 50
              ? `${record.content.substring(0, 50)}...`
              : record.content}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {record.content.length > 100
              ? `${record.content.substring(0, 100)}...`
              : record.content}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày",
      key: "date",
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 14 }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.createdAt).format("hh:mm A")}
          </Text>
        </div>
      ),
    },
    {
      title: "Thống kê",
      key: "stats",
      width: 120,
      render: (_, record) => (
        <Space size="middle" style={{ fontSize: 12 }}>
          <Tooltip title="Lượt thích">
            <Space size={4}>
              <LikeOutlined />
              <span>{record.likes}</span>
            </Space>
          </Tooltip>
          <Tooltip title="Bình luận">
            <Space size={4}>
              <CommentOutlined />
              <span>{record.commentsCount}</span>
            </Space>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => (
        <div>
          {isAdminOrEditor ? (
            <Select
              value={record.status || 'active'}
              onChange={(value) => handleStatusChange(record.id, value)}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="active">Hoạt động</Option>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="reported">Bị báo cáo</Option>
              <Option value="archived">Đã lưu trữ</Option>
            </Select>
          ) : (
            getStatusTag(record.status)
          )}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {isAdminOrEditor && (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Xóa bài viết"
                description="Bạn có chắc chắn muốn xóa bài viết này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Breadcrumbs & Heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <Space split={<span style={{ color: "#4c739a" }}>/</span>}>
            <Text type="secondary">Quản trị</Text>
            <Text strong>Quản lý bài viết</Text>
          </Space>
        </div>
        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
          Quản lý bài viết
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Quản lý, kiểm duyệt và xem xét nội dung do người dùng tạo từ feed cộng đồng.
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                  Chờ xem xét
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Statistic
                    value={stats.pending}
                    valueStyle={{ fontSize: 28, fontWeight: "bold" }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12, color: "#fa8c16" }}>
                  <ClockCircleOutlined /> Cần chú ý
                </Text>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#fff7e6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                  Bài viết bị báo cáo
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Statistic
                    value={stats.reported}
                    valueStyle={{ fontSize: 28, fontWeight: "bold" }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cần xử lý ngay
                </Text>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#fff1f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FlagOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                  Tổng bài viết hoạt động
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Statistic
                    value={stats.total}
                    valueStyle={{ fontSize: 28, fontWeight: "bold" }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 12, color: "#52c41a" }}>
                  <CheckCircleOutlined /> Bài viết hoạt động
                </Text>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#f6ffed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters & Search Toolbar */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          marginBottom: 24,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Tìm kiếm theo từ khóa, tác giả hoặc ID bài viết..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái: Tất cả"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="reported">Bị báo cáo</Option>
              <Option value="archived">Đã lưu trữ</Option>
            </Select>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Space>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => {
                  // Date filter logic here
                }}
              >
                30 ngày qua
              </Button>
              {(searchText || statusFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchText("");
                    setStatusFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedRowKeys.length > 0 && (
        <Card
          style={{
            borderRadius: 12,
            border: "1px solid #137fec",
            background: "rgba(19, 127, 236, 0.1)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong style={{ color: "#137fec" }}>
              Đã chọn {selectedRowKeys.length} mục
            </Text>
            <Space>
              <Popconfirm
                title="Xóa các bài viết đã chọn"
                description={`Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} bài viết?`}
                onConfirm={handleBulkDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa đã chọn
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} đến ${range[1]} trong tổng số ${total} kết quả`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa bài viết"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingPost(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea rows={6} placeholder="Nội dung bài viết" />
          </Form.Item>
          <Form.Item name="imageUrl" label="URL hình ảnh">
            <Input placeholder="URL hình ảnh" />
          </Form.Item>
          {editingPost?.imageUrl && (
            <div style={{ marginBottom: 16 }}>
              <Image
                src={editingPost.imageUrl}
                alt="Post image"
                width={200}
                style={{ borderRadius: 8 }}
              />
            </div>
          )}
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết bài viết"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingPost(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {viewingPost && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <Avatar
                src={viewingPost.user.avatar_url}
                icon={<UserOutlined />}
                size={48}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {viewingPost.user.name}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ID: #{viewingPost.id.slice(-4)} • {dayjs(viewingPost.createdAt).format("MMM DD, YYYY hh:mm A")}
                </Text>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text>{viewingPost.content}</Text>
            </div>
            {viewingPost.imageUrl && (
              <div style={{ marginBottom: 16 }}>
                <Image
                  src={viewingPost.imageUrl}
                  alt="Post image"
                  width="100%"
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              <Space>
                <LikeOutlined />
                <Text>{viewingPost.likes} lượt thích</Text>
              </Space>
              <Space>
                <CommentOutlined />
                <Text>{viewingPost.commentsCount} bình luận</Text>
              </Space>
              <div>{getStatusTag(viewingPost.status)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

