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
  Typography,
  Modal,
  Form,
  Popconfirm,
  Spin,
  Row,
  Col,
  Switch,
  Statistic,
  message,
  Tabs,
} from "antd";
import { useMessageApi } from "@/components/providers/Message";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getUserProfile } from "@/helper/api";
import Cookies from "js-cookie";
import {
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  toggleCoursePublish,
  type AdminCourse,
} from "@/service/admin-courses";
import { getAccess } from "@/helper/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CoursesManagementPage() {
  const messageApi = useMessageApi();
  const router = useRouter();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [aiCourses, setAiCourses] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"courses" | "ai">("courses");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAdminCourses({
        page: pagination.current,
        limit: pagination.pageSize,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: searchText || undefined,
      });
      setCourses(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.totalItems || response.data?.length || 0,
      }));
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tải danh sách khóa học"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter, messageApi]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchAiCourses = async () => {
    setAiLoading(true);
    try {
      const response = await getAccess("admin/ai-learning-paths?limit=100");
      setAiCourses(response.data || []);
    } catch (error: any) {
      console.error("Error fetching AI courses:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tải khóa học AI"
      );
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ai") {
      fetchAiCourses();
    }
  }, [activeTab]);

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

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAddCourse = async (values: any) => {
    try {
      // Get current user as instructor
      const userId = Cookies.get('user_id');
      if (!userId) {
        messageApi.error("Không tìm thấy thông tin người dùng");
        return;
      }

      // Map form values to DTO format
      const courseData: any = {
        title: values.title,
        description: values.description,
        category: values.category,
        language: values.language || 'English', // Default to English
        level: values.level || values.difficulty || 'Beginner', // Map difficulty to level
        price: Number(values.price) || 0,
        instructor: userId,
        status: values.published ? 'published' : 'draft',
      };

      await createAdminCourse(courseData);
      messageApi.success("Tạo khóa học thành công");
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchCourses();
    } catch (error: any) {
      console.error("Error creating course:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể tạo khóa học"
      );
    }
  };

  const handleEditCourse = async (values: any) => {
    if (!editingCourse) return;
    try {
      // Map published boolean to status string
      const courseData = {
        ...values,
        status: values.published ? 'published' : 'draft',
      };
      delete courseData.published; // Remove published field
      await updateAdminCourse(editingCourse._id, courseData);
      messageApi.success("Cập nhật khóa học thành công");
      setIsEditModalVisible(false);
      setEditingCourse(null);
      editForm.resetFields();
      fetchCourses();
    } catch (error: any) {
      console.error("Error updating course:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật khóa học"
      );
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteAdminCourse(courseId);
      messageApi.success("Xóa khóa học thành công");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể xóa khóa học"
      );
    }
  };

  const handleTogglePublish = async (courseId: string, published: boolean) => {
    try {
      await toggleCoursePublish(courseId, published);
      messageApi.success(
        published ? "Đã xuất bản khóa học" : "Đã ẩn khóa học"
      );
      fetchCourses();
    } catch (error: any) {
      console.error("Error toggling publish:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể thay đổi trạng thái"
      );
    }
  };

  const openEditModal = (course: AdminCourse) => {
    setEditingCourse(course);
    editForm.setFieldsValue({
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      level: (course as any).level || course.difficulty,
      language: (course as any).language || 'English',
      published: course.status === 'published' || course.published,
    });
    setIsEditModalVisible(true);
  };

  const columns: ColumnsType<AdminCourse> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/admin/courses/${record._id}`)}
        >
          <BookOutlined />
          <Text strong style={{ color: "#1890ff" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category) => {
        const colorMap: Record<string, string> = {
          HSK: "blue",
          TOEIC: "green",
          IELTS: "orange",
        };
        return <Tag color={colorMap[category] || "default"}>{category}</Tag>;
      },
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <Text>{price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")} VNĐ`}</Text>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "level",
      key: "level",
      render: (level, record) => level || (record as any).difficulty || "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const isPublished = status === 'published';
        return (
          <Switch
            checked={isPublished}
            onChange={(checked) => handleTogglePublish(record._id, checked)}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
          />
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa khóa học"
            description="Bạn có chắc chắn muốn xóa khóa học này?"
            onConfirm={() => handleDeleteCourse(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.status === 'published' || c.published).length,
    free: courses.filter((c) => c.price === 0).length,
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            Quản lý khóa học
          </Title>
          <Text type="secondary">
            Quản lý tất cả khóa học trong hệ thống
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            Tạo khóa học mới
          </Button>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={stats.total}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã xuất bản"
              value={stats.published}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Miễn phí"
              value={stats.free}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm khóa học..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Lọc theo danh mục"
              style={{ width: "100%" }}
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              prefixIcon={<FilterOutlined />}
            >
              <Option value="all">Tất cả</Option>
              <Option value="HSK">HSK</Option>
              <Option value="TOEIC">TOEIC</Option>
              <Option value="IELTS">IELTS</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Courses Table */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "courses" | "ai")}
          items={[
            {
              key: "courses",
              label: `Khóa học thường (${stats.total})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={courses}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} khóa học`,
                  }}
                  onChange={handleTableChange}
                />
              ),
            },
            {
              key: "ai",
              label: `Khóa học AI (${aiCourses.length})`,
              children: (
                <Spin spinning={aiLoading}>
                  <Table
                    dataSource={aiCourses}
                    rowKey="_id"
                    columns={[
                      {
                        title: "Tiêu đề",
                        key: "title",
                        render: (_, record) => (
                          <Space>
                            <Tag color="purple">AI</Tag>
                            <Text strong>{record.title}</Text>
                          </Space>
                        ),
                      },
                      {
                        title: "Trình độ",
                        dataIndex: "level",
                        key: "level",
                      },
                      {
                        title: "Tổng ngày",
                        dataIndex: "totalDays",
                        key: "totalDays",
                      },
                      {
                        title: "Tiến độ",
                        dataIndex: "progressPercentage",
                        key: "progressPercentage",
                        render: (progress) => `${progress}%`,
                      },
                      {
                        title: "Ngày tạo",
                        dataIndex: "createdAt",
                        key: "createdAt",
                        render: (date) => dayjs(date).format("DD/MM/YYYY"),
                      },
                    ]}
                    pagination={{
                      pageSize: 10,
                      showTotal: (total) => `Tổng ${total} khóa học AI`,
                    }}
                  />
                </Spin>
              ),
            },
          ]}
        />
      </Card>

      {/* Add Course Modal */}
      <Modal
        title="Tạo khóa học mới"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="Tạo"
        cancelText="Hủy"
        width={700}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddCourse}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề khóa học" />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả khóa học" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select placeholder="Chọn danh mục">
                  <Option value="HSK">HSK</Option>
                  <Option value="TOEIC">TOEIC</Option>
                  <Option value="IELTS">IELTS</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngôn ngữ"
                name="language"
                rules={[{ required: true, message: "Vui lòng chọn ngôn ngữ" }]}
                initialValue="English"
              >
                <Select placeholder="Chọn ngôn ngữ">
                  <Option value="English">English</Option>
                  <Option value="Chinese">Chinese</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mức độ"
                name="level"
                rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}
              >
                <Select placeholder="Chọn mức độ">
                  <Option value="Beginner">Beginner</Option>
                  <Option value="Intermediate">Intermediate</Option>
                  <Option value="Advanced">Advanced</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[
                  { required: true, message: "Vui lòng nhập giá" },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.reject(new Error("Vui lòng nhập giá"));
                      }
                      const numValue = Number(value);
                      if (isNaN(numValue) || numValue < 0) {
                        return Promise.reject(new Error("Giá phải là số >= 0"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                getValueFromEvent={(e) => {
                  const value = e.target.value;
                  return value === '' ? undefined : Number(value);
                }}
              >
                <Input type="number" placeholder="0 = Miễn phí" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Xuất bản"
                name="published"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        title="Chỉnh sửa khóa học"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingCourse(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditCourse}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề khóa học" />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả khóa học" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select placeholder="Chọn danh mục">
                  <Option value="HSK">HSK</Option>
                  <Option value="TOEIC">TOEIC</Option>
                  <Option value="IELTS">IELTS</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngôn ngữ"
                name="language"
                rules={[{ required: true, message: "Vui lòng chọn ngôn ngữ" }]}
              >
                <Select placeholder="Chọn ngôn ngữ">
                  <Option value="English">English</Option>
                  <Option value="Chinese">Chinese</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mức độ"
                name="level"
                rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}
              >
                <Select placeholder="Chọn mức độ">
                  <Option value="Beginner">Beginner</Option>
                  <Option value="Intermediate">Intermediate</Option>
                  <Option value="Advanced">Advanced</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[
                  { required: true, message: "Vui lòng nhập giá" },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.reject(new Error("Vui lòng nhập giá"));
                      }
                      const numValue = Number(value);
                      if (isNaN(numValue) || numValue < 0) {
                        return Promise.reject(new Error("Giá phải là số >= 0"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                getValueFromEvent={(e) => {
                  const value = e.target.value;
                  return value === '' ? undefined : Number(value);
                }}
              >
                <Input type="number" placeholder="0 = Miễn phí" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Xuất bản"
                name="published"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

