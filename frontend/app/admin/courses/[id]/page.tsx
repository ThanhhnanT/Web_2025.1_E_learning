"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Spin,
  Row,
  Col,
  Tag,
  Collapse,
  Empty,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getAccess,
  postAccess,
  patchAccess,
  deleteAccess,
  uploadVideo,
} from "@/helper/api";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

interface Module {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  totalLessons?: number;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  type: "video" | "text" | "quiz";
  content?: any;
  duration?: number;
}

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isModuleModalVisible, setIsModuleModalVisible] = useState(false);
  const [isLessonModalVisible, setIsLessonModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseForm] = Form.useForm();

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const response = await getAccess(`admin/courses/${courseId}/full`);
      setCourse(response.course);
      setModules(response.modules || []);
    } catch (error: any) {
      console.error("Error fetching course:", error);
      message.error(
        error?.response?.data?.message || "Không thể tải thông tin khóa học"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (values: any) => {
    try {
      await postAccess("admin/courses/modules", {
        ...values,
        courseId,
      });
      message.success("Tạo module thành công");
      setIsModuleModalVisible(false);
      moduleForm.resetFields();
      fetchCourseData();
    } catch (error: any) {
      console.error("Error creating module:", error);
      message.error(
        error?.response?.data?.message || "Không thể tạo module"
      );
    }
  };

  const handleEditModule = async (values: any) => {
    if (!editingModule) return;
    try {
      await patchAccess(`admin/courses/modules/${editingModule._id}`, values);
      message.success("Cập nhật module thành công");
      setIsModuleModalVisible(false);
      setEditingModule(null);
      moduleForm.resetFields();
      fetchCourseData();
    } catch (error: any) {
      console.error("Error updating module:", error);
      message.error(
        error?.response?.data?.message || "Không thể cập nhật module"
      );
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteAccess(`admin/courses/modules/${moduleId}`);
      message.success("Xóa module thành công");
      fetchCourseData();
    } catch (error: any) {
      console.error("Error deleting module:", error);
      message.error(
        error?.response?.data?.message || "Không thể xóa module"
      );
    }
  };

  const handleAddLesson = async (values: any) => {
    if (!selectedModuleId) return;
    try {
      await postAccess("admin/courses/lessons", {
        ...values,
        moduleId: selectedModuleId,
      });
      message.success("Tạo lesson thành công");
      setIsLessonModalVisible(false);
      setSelectedModuleId(null);
      lessonForm.resetFields();
      fetchCourseData();
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      message.error(
        error?.response?.data?.message || "Không thể tạo lesson"
      );
    }
  };

  const handleEditLesson = async (values: any) => {
    if (!editingLesson) return;
    try {
      await patchAccess(`admin/courses/lessons/${editingLesson._id}`, values);
      message.success("Cập nhật lesson thành công");
      setIsLessonModalVisible(false);
      setEditingLesson(null);
      lessonForm.resetFields();
      fetchCourseData();
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      message.error(
        error?.response?.data?.message || "Không thể cập nhật lesson"
      );
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteAccess(`admin/courses/lessons/${lessonId}`);
      message.success("Xóa lesson thành công");
      fetchCourseData();
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      message.error(
        error?.response?.data?.message || "Không thể xóa lesson"
      );
    }
  };

  const openModuleEdit = (module: Module) => {
    setEditingModule(module);
    moduleForm.setFieldsValue({
      title: module.title,
      description: module.description,
      order: module.order,
    });
    setIsModuleModalVisible(true);
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const result = await uploadVideo(file);
      if (result?.video_url) {
        lessonForm.setFieldsValue({ content: result.video_url });
        setVideoPreview(result.video_url);
        message.success("Upload video thành công!");
      } else {
        throw new Error("Upload failed: No video URL returned");
      }
    } catch (error: any) {
      console.error("Error uploading video:", error);
      message.error(
        error?.response?.data?.message || "Không thể upload video. Vui lòng thử lại."
      );
    } finally {
      setUploadingVideo(false);
    }
  };

  const openLessonEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const contentValue =
      typeof lesson.content === "string" ? lesson.content : JSON.stringify(lesson.content);
    
    // Check if content is a video URL
    if (lesson.type === "video" && contentValue && contentValue.startsWith("http")) {
      setVideoPreview(contentValue);
    } else {
      setVideoPreview(null);
    }
    
    lessonForm.setFieldsValue({
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      type: lesson.type,
      content: contentValue,
      duration: lesson.duration,
    });
    setIsLessonModalVisible(true);
  };

  const openLessonAdd = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setVideoPreview(null);
    setIsLessonModalVisible(true);
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <PlayCircleOutlined style={{ color: "#1890ff" }} />;
      case "text":
        return <FileTextOutlined style={{ color: "#52c41a" }} />;
      case "quiz":
        return <QuestionCircleOutlined style={{ color: "#faad14" }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/courses")}
            >
              Quay lại
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {course?.title || "Chi tiết khóa học"}
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingModule(null);
              moduleForm.resetFields();
              setIsModuleModalVisible(true);
            }}
          >
            Thêm Module
          </Button>
        </Space>

        {course && (
          <Card
            title="Thông tin khóa học"
            extra={
              <Button
                type={isEditingCourse ? "default" : "primary"}
                icon={isEditingCourse ? <DeleteOutlined /> : <EditOutlined />}
                onClick={() => {
                  if (isEditingCourse) {
                    setIsEditingCourse(false);
                    courseForm.resetFields();
                  } else {
                    setIsEditingCourse(true);
                    courseForm.setFieldsValue({
                      description: course.description,
                      category: course.category,
                      price: course.price,
                    });
                  }
                }}
              >
                {isEditingCourse ? "Hủy" : "Chỉnh sửa"}
              </Button>
            }
          >
            {isEditingCourse ? (
              <Form
                form={courseForm}
                layout="vertical"
                onFinish={async (values) => {
                  try {
                    await patchAccess(`admin/courses/${courseId}`, values);
                    message.success("Cập nhật thông tin khóa học thành công");
                    setIsEditingCourse(false);
                    fetchCourseData();
                  } catch (error: any) {
                    console.error("Error updating course:", error);
                    message.error(
                      error?.response?.data?.message || "Không thể cập nhật thông tin"
                    );
                  }
                }}
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      label="Mô tả"
                      name="description"
                      rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                    >
                      <TextArea rows={4} placeholder="Nhập mô tả khóa học" />
                    </Form.Item>
                  </Col>
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
                    <Form.Item
                      label="Giá (VNĐ)"
                      name="price"
                      rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                    >
                      <Input type="number" placeholder="0 = Miễn phí" min={0} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Lưu
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingCourse(false);
                        courseForm.resetFields();
                      }}
                    >
                      Hủy
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Mô tả: </Text>
                  <Text>{course.description || "N/A"}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>Danh mục: </Text>
                  <Tag>{course.category || "N/A"}</Tag>
                </Col>
                <Col span={6}>
                  <Text strong>Giá: </Text>
                  <Text>{course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")} VNĐ`}</Text>
                </Col>
              </Row>
            )}
          </Card>
        )}

        {modules.length === 0 ? (
          <Card>
            <Empty description="Chưa có module nào. Hãy tạo module đầu tiên!" />
          </Card>
        ) : (
          <Collapse>
            {modules
              .sort((a, b) => a.order - b.order)
              .map((module) => (
                <Panel
                  key={module._id}
                  header={
                    <Space>
                      <BookOutlined />
                      <Text strong>{module.title}</Text>
                      <Text type="secondary">
                        ({module.lessons?.length || 0} lessons)
                      </Text>
                    </Space>
                  }
                  extra={
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLessonAdd(module._id);
                        }}
                      >
                        Thêm Lesson
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModuleEdit(module);
                        }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xóa module"
                        description="Bạn có chắc chắn muốn xóa module này? Tất cả lessons trong module sẽ bị xóa."
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDeleteModule(module._id);
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                      >
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Space>
                  }
                >
                  {module.lessons && module.lessons.length > 0 ? (
                    <Table
                      dataSource={module.lessons.sort((a, b) => a.order - b.order)}
                      rowKey="_id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: "Thứ tự",
                          dataIndex: "order",
                          key: "order",
                          width: 80,
                        },
                        {
                          title: "Tiêu đề",
                          key: "title",
                          render: (_, record) => (
                            <Space>
                              {getLessonIcon(record.type)}
                              <Text>{record.title}</Text>
                            </Space>
                          ),
                        },
                        {
                          title: "Loại",
                          dataIndex: "type",
                          key: "type",
                          render: (type) => {
                            const typeMap: Record<string, { label: string; color: string }> = {
                              video: { label: "Video", color: "blue" },
                              text: { label: "Text", color: "green" },
                              quiz: { label: "Quiz", color: "orange" },
                            };
                            const info = typeMap[type] || { label: type, color: "default" };
                            return <Tag color={info.color}>{info.label}</Tag>;
                          },
                        },
                        {
                          title: "Thời lượng",
                          dataIndex: "duration",
                          key: "duration",
                          render: (duration) => duration ? `${duration} phút` : "N/A",
                        },
                        {
                          title: "Thao tác",
                          key: "actions",
                          render: (_, record) => (
                            <Space>
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openLessonEdit(record)}
                              >
                                Sửa
                              </Button>
                              <Popconfirm
                                title="Xóa lesson"
                                description="Bạn có chắc chắn muốn xóa lesson này?"
                                onConfirm={() => handleDeleteLesson(record._id)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okType="danger"
                              >
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                >
                                  Xóa
                                </Button>
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty
                      description="Chưa có lesson nào"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Panel>
              ))}
          </Collapse>
        )}

        {/* Module Modal */}
        <Modal
          title={editingModule ? "Chỉnh sửa Module" : "Tạo Module mới"}
          open={isModuleModalVisible}
          onCancel={() => {
            setIsModuleModalVisible(false);
            setEditingModule(null);
            moduleForm.resetFields();
          }}
          onOk={() => moduleForm.submit()}
          okText={editingModule ? "Lưu" : "Tạo"}
          cancelText="Hủy"
        >
          <Form
            form={moduleForm}
            layout="vertical"
            onFinish={editingModule ? handleEditModule : handleAddModule}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input placeholder="Nhập tiêu đề module" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={3} placeholder="Nhập mô tả module" />
            </Form.Item>
            <Form.Item
              label="Thứ tự"
              name="order"
              rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
            >
              <Input type="number" min={1} placeholder="1" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Lesson Modal */}
        <Modal
          title={editingLesson ? "Chỉnh sửa Lesson" : "Tạo Lesson mới"}
          open={isLessonModalVisible}
          onCancel={() => {
            setIsLessonModalVisible(false);
            setEditingLesson(null);
            setSelectedModuleId(null);
            setVideoPreview(null);
            lessonForm.resetFields();
          }}
          onOk={() => lessonForm.submit()}
          okText={editingLesson ? "Lưu" : "Tạo"}
          cancelText="Hủy"
          width={700}
        >
          <Form
            form={lessonForm}
            layout="vertical"
            onFinish={editingLesson ? handleEditLesson : handleAddLesson}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input placeholder="Nhập tiêu đề lesson" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={3} placeholder="Nhập mô tả lesson" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Loại"
                  name="type"
                  rules={[{ required: true, message: "Vui lòng chọn loại" }]}
                >
                  <Select placeholder="Chọn loại lesson">
                    <Option value="video">Video</Option>
                    <Option value="text">Text</Option>
                    <Option value="quiz">Quiz</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Thứ tự"
                  name="order"
                  rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
                >
                  <Input type="number" min={1} placeholder="1" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) => {
                const lessonType = getFieldValue("type");
                if (lessonType === "video") {
                  return (
                    <>
                      <Form.Item
                        label="Video"
                        name="content"
                        rules={[{ required: true, message: "Vui lòng upload video" }]}
                      >
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {videoPreview && (
                            <div style={{ position: "relative", marginBottom: 8 }}>
                              <video
                                src={videoPreview}
                                controls
                                style={{ width: "100%", maxHeight: 300, borderRadius: 8 }}
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  setVideoPreview(null);
                                  lessonForm.setFieldsValue({ content: "" });
                                }}
                                style={{ position: "absolute", top: 8, right: 8 }}
                              >
                                Xóa
                              </Button>
                            </div>
                          )}
                          <Upload
                            accept="video/*"
                            beforeUpload={(file) => {
                              const isVideo = file.type.startsWith("video/");
                              if (!isVideo) {
                                message.error("Chỉ chấp nhận file video!");
                                return false;
                              }
                              const isLt500M = file.size / 1024 / 1024 < 500;
                              if (!isLt500M) {
                                message.error("Video phải nhỏ hơn 500MB!");
                                return false;
                              }
                              handleVideoUpload(file);
                              return false;
                            }}
                            showUploadList={false}
                          >
                            <Button icon={<UploadOutlined />} loading={uploadingVideo}>
                              {videoPreview ? "Thay đổi video" : "Upload video"}
                            </Button>
                          </Upload>
                          <Input
                            placeholder="Hoặc nhập URL video"
                            onChange={(e) => {
                              if (e.target.value && !videoPreview) {
                                lessonForm.setFieldsValue({ content: e.target.value });
                              }
                            }}
                          />
                        </Space>
                      </Form.Item>
                    </>
                  );
                }
                return (
                  <Form.Item
                    label="Nội dung"
                    name="content"
                    rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
                  >
                    <TextArea
                      rows={6}
                      placeholder={
                        lessonType === "text"
                          ? "Nhập nội dung text"
                          : lessonType === "quiz"
                          ? "Nhập JSON cho quiz"
                          : "Nhập nội dung"
                      }
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
            <Form.Item label="Thời lượng (phút)" name="duration">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Spin>
  );
}

