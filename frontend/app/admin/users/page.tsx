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
  Switch,
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
} from "@ant-design/icons";
import { getUsers, createUser, updateUser, deleteUser, type User, type CreateUserData, type UpdateUserData } from "@/service/users";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;
const { Option } = Select;

export default function UsersManagementPage() {
  const messageApi = useMessageApi();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers(
        pagination.current,
        pagination.pageSize,
        searchText || undefined,
        roleFilter !== "all" ? roleFilter : undefined
      );
      setUsers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.totalItems,
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tải danh sách người dùng"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAddUser = async (values: CreateUserData) => {
    try {
      await createUser(values);
      messageApi.success("Tạo người dùng thành công");
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tạo người dùng"
      );
    }
  };

  const handleEditUser = async (values: any) => {
    if (!editingUser) return;
    try {
      // Remove email from update data as it's not allowed to be updated
      // Also filter out undefined values
      const { email, ...rest } = values;
      const updateData: UpdateUserData = {};
      
      if (rest.name !== undefined) updateData.name = rest.name;
      if (rest.phone !== undefined) updateData.phone = rest.phone;
      if (rest.bio !== undefined) updateData.bio = rest.bio;
      if (rest.role !== undefined) updateData.role = rest.role;
      if (rest.email_verified !== undefined) updateData.email_verified = rest.email_verified;
      
      await updateUser(editingUser._id, updateData);
      messageApi.success("Cập nhật người dùng thành công");
      setIsEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật người dùng"
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      messageApi.success("Xóa người dùng thành công");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể xóa người dùng"
      );
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      bio: user.bio || "",
      role: user.role,
      email_verified: user.email_verified,
    });
    setIsEditModalVisible(true);
  };

  const getStatusTag = (user: User) => {
    if (user.email_verified) {
      return <Tag color="green">Active</Tag>;
    } else {
      return <Tag color="orange">Pending</Tag>;
    }
  };

  const formatLastLogin = (user: User) => {
    const targetDate = user.lastLoginAt || user.createdAt;
    if (targetDate) {
      const date = dayjs(targetDate);
      const now = dayjs();
      const diffDays = now.diff(date, "day");
      
      if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "1 day ago";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? "month" : "months"} ago`;
      } else {
        return date.format("MMM DD, YYYY");
      }
    }
    return "Never";
  };

  const columns: ColumnsType<User> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar_url}
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div>
              <Text strong>{record.name}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : "default"}>
          {role === "admin" ? "Admin" : "User"}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Last Login",
      key: "lastLogin",
      render: (_, record) => (
        <Text type="secondary">{formatLastLogin(record)}</Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Button
            type="text"
            onClick={() => router.push(`/admin/users/${record._id}`)}
          >
            View
          </Button>
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            User Management
          </Title>
          <Text type="secondary">Manage all users in the system.</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsAddModalVisible(true)}
          >
            Add User
          </Button>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              style={{ width: 150 }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Roles</Option>
              <Option value="administrator">Administrator</Option>
              <Option value="editor">Editor</Option>
              <Option value="viewer">Viewer</Option>
              <Option value="support">Support</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => router.push(`/admin/users/${record._id}`),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `Showing ${range[0]} to ${range[1]} of ${total} entries`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add User Modal */}
      <Modal
        title="Add User"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddUser}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: "Please enter phone" }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="user"
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Create User
              </Button>
              <Button
                onClick={() => {
                  setIsAddModalVisible(false);
                  addForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditUser}
          autoComplete="off"
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            shouldUpdate={false}
          >
            <Input placeholder="Enter email" disabled />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="Bio"
          >
            <Input.TextArea
              placeholder="Enter bio"
              rows={3}
            />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="email_verified"
            label="Email Verified"
            valuePropName="checked"
          >
            <Switch checkedChildren="Verified" unCheckedChildren="Not Verified" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Update User
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingUser(null);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

