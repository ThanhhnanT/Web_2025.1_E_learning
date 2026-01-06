"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  Divider,
  Drawer,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Spin,
  Upload,
} from "antd";
import {
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  FileAddOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  Test,
  TestStatus,
  TestSection,
  QuestionGroup,
} from "@/types/test";
import {
  fetchTestStructure,
  updateTest,
  createSection,
  deleteSection,
  createGroup,
  updateGroup,
  deleteGroup,
  createQuestion,
  deleteQuestion,
  upsertAnswer,
} from "@/service/tests";
import type { RcFile } from "antd/es/upload";
import { uploadVideo } from "@/helper/api";
import dynamic from "next/dynamic";

const TinyMCEEditor = dynamic(
  () => import("@/components/TinyMCEEditor"),
  { ssr: false }
);

const { Title, Text } = Typography;

const statusColors: Record<TestStatus, string> = {
  [TestStatus.ACTIVE]: "green",
  [TestStatus.DRAFT]: "orange",
  [TestStatus.ARCHIVED]: "red",
};

export default function AdminTestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const testId = params?.id;

  const [basicForm] = Form.useForm<Partial<Test>>();
  const [sectionForm] = Form.useForm<any>();
  const [groupForm] = Form.useForm<any>();
  const [questionForm] = Form.useForm<any>();
  const [answerForm] = Form.useForm<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structure, setStructure] = useState<any | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [answerDrawerOpen, setAnswerDrawerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TestSection | null>(
    null
  );
  const [selectedGroup, setSelectedGroup] = useState<QuestionGroup | null>(
    null
  );

  const statusOptions = useMemo(
    () => [
      { label: "Bản nháp", value: TestStatus.DRAFT },
      { label: "Đã xuất bản", value: TestStatus.ACTIVE },
      { label: "Đã lưu trữ", value: TestStatus.ARCHIVED },
    ],
    []
  );

  const loadStructure = async () => {
    if (!testId) return;
    try {
      setStructureLoading(true);
      const res = await fetchTestStructure(testId);
      setStructure(res);
      basicForm.setFieldsValue(res);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải chi tiết bài test");
    } finally {
      setStructureLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const handleUpdateBasic = async () => {
    if (!structure?._id) return;
    try {
      setSaving(true);
      const values = await basicForm.validateFields();
      await updateTest(structure._id, values);
      message.success("Đã cập nhật thông tin bài test");
      await loadStructure();
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật bài test");
    } finally {
      setSaving(false);
    }
  };

  const refreshStructure = async () => {
    await loadStructure();
  };

  const handleCreateSection = async () => {
    if (!structure?._id) return;
    try {
      const values = await sectionForm.validateFields();
      const resources: any = {};
      
      // Nếu là listening section và có audio URL, lưu vào resources.audio
      if (values.sectionType === "listening" && values.audioUrl) {
        resources.audio = values.audioUrl;
      }
      
      await createSection(structure._id, {
        ...values,
        resources: Object.keys(resources).length > 0 ? resources : {},
        questionRange: [values.questionRangeStart, values.questionRangeEnd],
      });
      message.success("Đã tạo section");
      setSectionDrawerOpen(false);
      sectionForm.resetFields();
      await refreshStructure();
    } catch (err) {
      console.error(err);
      message.error("Tạo section thất bại");
    }
  };

  const handleCreateGroup = async () => {
    if (!structure?._id || !selectedSection?._id) return;
    try {
      const values = await groupForm.validateFields();
      
      // Xử lý sharedContent: lưu contextHtml từ TinyMCE vào sharedContent.contextHtml
      const sharedContent: any = {};
      if (values.contextHtml) {
        sharedContent.contextHtml = values.contextHtml;
      }
      
      const payload = {
        ...values,
        sharedContent: Object.keys(sharedContent).length > 0 ? sharedContent : {},
        questionRange: [values.questionRangeStart, values.questionRangeEnd],
      };
      
      // Xóa contextHtml khỏi payload vì đã được đưa vào sharedContent
      delete payload.contextHtml;

      if (editingGroup && selectedGroup?._id) {
        await updateGroup(
          structure._id,
          selectedSection._id,
          selectedGroup._id,
          payload
        );
        message.success("Đã cập nhật nhóm câu hỏi");
      } else {
        await createGroup(structure._id, selectedSection._id, payload);
        message.success("Đã tạo nhóm câu hỏi");
      }

      setGroupDrawerOpen(false);
      groupForm.resetFields();
      setEditingGroup(false);
      await refreshStructure();
    } catch (err) {
      console.error(err);
      message.error("Lưu nhóm câu hỏi thất bại");
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedGroup?._id) return;
    try {
      const values = await questionForm.validateFields();
      const correctAnswerValues =
        typeof values.correctAnswerValue === "string"
          ? values.correctAnswerValue
              .split("|")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
      const alternatives =
        typeof values.alternatives === "string"
          ? values.alternatives
              .split("|")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
      const payload: any = {
        questionGroupId: selectedGroup._id,
        questionNumber: values.questionNumber,
        questionType: values.questionType,
        questionText: values.questionText,
        correctAnswer: { value: correctAnswerValues, alternatives },
        order: values.order,
      };
      if (values.optionsJson) {
        try {
          payload.options = JSON.parse(values.optionsJson);
        } catch {
          message.error("Options JSON không hợp lệ");
          return;
        }
      }
      await createQuestion(selectedGroup._id, payload);
      message.success("Đã tạo câu hỏi");
      setQuestionDrawerOpen(false);
      questionForm.resetFields();
      await refreshStructure();
    } catch (err) {
      console.error(err);
      message.error("Tạo câu hỏi thất bại");
    }
  };

  const handleUpsertAnswer = async () => {
    if (!structure?._id || !selectedSection?._id) return;
    try {
      const values = await answerForm.validateFields();
      let answerKeys = values.answerKeys;
      
      // Nếu answerKeys là array từ Form.List, giữ nguyên
      // Nếu là string (từ textarea cũ), parse JSON
      if (typeof answerKeys === "string") {
        try {
          answerKeys = JSON.parse(answerKeys);
        } catch {
          message.error("answerKeys phải là JSON hợp lệ");
          return;
        }
      }
      
      // Đảm bảo answerKeys là mảng và correctAnswer là mảng string
      if (!Array.isArray(answerKeys)) {
        message.error("answerKeys phải là mảng");
        return;
      }

      answerKeys = answerKeys.map((item: any) => {
        let correct = item?.correctAnswer;
        if (typeof correct === "string") {
          // Nếu người dùng nhập 1 chuỗi, chuyển thành mảng 1 phần tử
          correct = correct.trim() ? [correct.trim()] : [];
        } else if (Array.isArray(correct)) {
          correct = correct.map((v) => String(v).trim()).filter(Boolean);
        } else {
          correct = [];
        }
        return {
          ...item,
          correctAnswer: correct,
        };
      });
      
      await upsertAnswer(structure._id, selectedSection._id, {
        ...values,
        answerKeys,
      });
      message.success("Đã lưu đáp án");
      setAnswerDrawerOpen(false);
      answerForm.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Lưu đáp án thất bại");
    }
  };

  const renderStructure = (sections: TestSection[] = []) => {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {sections.map((s) => (
          <Card
            key={s._id}
            size="small"
            title={`${s.title} (${s.sectionType})`}
            extra={
              <Space size={8}>
                <Button
                  size="small"
                  icon={<FileAddOutlined />}
                  onClick={() => {
                    setSelectedSection(s);
                    setAnswerDrawerOpen(true);
                    answerForm.setFieldsValue({
                      sectionId: s._id,
                      testId: s.testId,
                      partNumber: s.partNumber,
                    });
                  }}
                >
                  Đáp án
                </Button>
                <Button
                  size="small"
                  icon={<PlusCircleOutlined />}
                  onClick={() => {
                    setSelectedSection(s);
                    setSelectedGroup(null);
                    setEditingGroup(false);
                    setGroupDrawerOpen(true);
                    groupForm.resetFields();
                    groupForm.setFieldsValue({ sectionId: s._id });
                  }}
                >
                  Thêm nhóm
                </Button>
                <Popconfirm
                  title="Xóa section?"
                  onConfirm={async () => {
                    await deleteSection(structure._id, s._id);
                    message.success("Đã xóa section");
                    await refreshStructure();
                  }}
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            }
          >
            <Text type="secondary">
              Câu {s.questionRange?.[0]} - {s.questionRange?.[1]}
            </Text>
            <Divider style={{ margin: "8px 0" }} />
            <Space direction="vertical" size={8}>
              {(s.questionGroups || []).map((g) => (
                <Card
                  key={g._id}
                  size="small"
                  type="inner"
                  title={g.title}
                  extra={
                    <Space size={8}>
                      <Button
                        size="small"
                        icon={<PlusCircleOutlined />}
                        onClick={() => {
                          setSelectedGroup(g);
                          setQuestionDrawerOpen(true);
                          questionForm.setFieldsValue({
                            questionGroupId: g._id,
                            order: (g.questionRange?.[0] ?? 1) - 1,
                            questionNumber: g.questionRange?.[0],
                          });
                        }}
                      >
                        Thêm câu
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn event bubble lên row
                          setSelectedSection(s);
                          setSelectedGroup(g);
                          setEditingGroup(true);
                          setGroupDrawerOpen(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xóa group?"
                        onConfirm={async () => {
                          await deleteGroup(structure._id, s._id, g._id);
                          message.success("Đã xóa group");
                          await refreshStructure();
                        }}
                      >
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Câu {g.questionRange?.[0]} - {g.questionRange?.[1]} •{" "}
                    {g.groupType}
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!structure) {
    return (
      <Card>
        <Text type="danger">Không tìm thấy bài test</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin/tests")}
        >
          Quay lại danh sách
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadStructure}
        >
          Tải lại
        </Button>
      </Space>

      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {structure.title}
            </Title>
            {structure.status && (
              <Tag color={statusColors[structure.status as TestStatus] || "default"}>
                {structure.status}
              </Tag>
            )}
          </Space>
        }
      >
        <Form
          form={basicForm}
          layout="vertical"
          initialValues={{ status: TestStatus.DRAFT }}
        >
          <Form.Item name="title" label="Tên bài test" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="series" label="Bộ sách">
            <Input placeholder="Cambridge IELTS 20" />
          </Form.Item>
          <Form.Item name="testNumber" label="Số bài test">
            <Input placeholder="Test 1" />
          </Form.Item>
          <Form.Item name="skill" label="Kỹ năng">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select placeholder="Chọn trạng thái" options={statusOptions} />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              loading={saving}
              onClick={handleUpdateBasic}
            >
              Lưu thông tin
            </Button>
          </div>
        </Form>
      </Card>

      <Card
        title="Cấu trúc bài test"
        extra={
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              setSectionDrawerOpen(true);
              sectionForm.setFieldsValue({ partNumber: 1, order: 0 });
            }}
          >
            Thêm section
          </Button>
        }
        loading={structureLoading}
      >
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text strong>{structure.title}</Text>
          <Text type="secondary">
            {structure.sections?.length || 0} phần •{" "}
            {structure.totalQuestions || "-"} câu
          </Text>
          {renderStructure(structure.sections || [])}
        </Space>
      </Card>

      {/* Section Modal */}
      <Modal
        title="Thêm phần thi"
        open={sectionDrawerOpen}
        onCancel={() => {
          setSectionDrawerOpen(false);
          sectionForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" form={sectionForm}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true }]}
          >
            <Input placeholder="Part 1" />
          </Form.Item>
          <Form.Item
            name="sectionType"
            label="Loại kỹ năng"
            rules={[{ required: true, message: "Vui lòng chọn loại kỹ năng" }]}
          >
            <Select
              placeholder="Chọn loại kỹ năng"
              options={[
                { label: "Nghe (Listening)", value: "listening" },
                { label: "Đọc (Reading)", value: "reading" },
                { label: "Viết (Writing)", value: "writing" },
                { label: "Nói (Speaking)", value: "speaking" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="partNumber"
            label="Số phần"
            rules={[{ required: true, message: "Vui lòng nhập số phần" }]}
          >
            <InputNumber min={1} placeholder="Ví dụ: 1" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Khoảng câu hỏi" required>
            <Space>
              <Form.Item
                name="questionRangeStart"
                noStyle
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="Bắt đầu" min={1} />
              </Form.Item>
              <Form.Item
                name="questionRangeEnd"
                noStyle
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="Kết thúc" min={1} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item
            name="order"
            label="Thứ tự"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.sectionType !== currentValues.sectionType
            }
          >
            {({ getFieldValue, setFieldValue }) =>
              getFieldValue("sectionType") === "listening" ? (
                <>
                  <Form.Item label="Audio cho section (upload lên Cloudinary)">
                    <Upload.Dragger
                      accept="audio/*"
                      multiple={false}
                      showUploadList={false}
                      beforeUpload={async (file: RcFile) => {
                        try {
                          const isAudio = file.type.startsWith("audio/");
                          if (!isAudio) {
                            message.error("Vui lòng chọn file audio hợp lệ");
                            return Upload.LIST_IGNORE;
                          }
                          const loadingKey = "upload-audio";
                          message.loading({
                            key: loadingKey,
                            content: "Đang upload audio lên Cloudinary...",
                            duration: 0,
                          });
                          const res: any = await uploadVideo(file as unknown as File);
                          const url = res?.url || res?.secure_url || res;
                          if (!url || typeof url !== "string") {
                            message.error("Upload audio thất bại");
                            message.destroy(loadingKey);
                            return Upload.LIST_IGNORE;
                          }
                          setFieldValue("audioUrl", url);
                          message.success({
                            key: loadingKey,
                            content: "Upload audio thành công",
                          });
                        } catch (err) {
                          console.error("Upload audio error", err);
                          message.error("Upload audio thất bại");
                        }
                        return Upload.LIST_IGNORE;
                      }}
                    >
                      <p className="ant-upload-drag-icon">Kéo / chọn file audio</p>
                      <p className="ant-upload-text">
                        Chọn file audio (mp3, m4a, wav, ...)
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                  <Form.Item name="audioUrl" hidden>
                    <Input />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              onClick={() => {
                setSectionDrawerOpen(false);
                sectionForm.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={handleCreateSection}>
              Lưu phần thi
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Group Modal */}
      <Modal
        title={editingGroup ? "Sửa nhóm câu hỏi" : "Thêm nhóm câu hỏi"}
        open={groupDrawerOpen}
        onCancel={() => {
          setGroupDrawerOpen(false);
          groupForm.resetFields();
          setEditingGroup(false);
        }}
        afterOpenChange={(open) => {
          // Khi modal mở xong, load dữ liệu vào form nếu đang ở chế độ sửa
          if (open && editingGroup && selectedGroup) {
            setTimeout(() => {
              const payload = {
                ...selectedGroup,
                questionRangeStart: selectedGroup.questionRange?.[0],
                questionRangeEnd: selectedGroup.questionRange?.[1],
                contextHtml: selectedGroup.sharedContent?.contextHtml || "",
              };
              groupForm.setFieldsValue(payload);
            }, 200);
          }
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form layout="vertical" form={groupForm}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true }]}
          >
            <Input placeholder="Questions 1-10" />
          </Form.Item>
          <Form.Item
            name="groupType"
            label="Loại nhóm câu hỏi"
            rules={[{ required: true, message: "Vui lòng chọn loại nhóm" }]}
          >
            <Select
              placeholder="Chọn loại nhóm"
              options={[
                { label: "shared_passage", value: "shared_passage" },
                { label: "shared_instruction", value: "shared_instruction" },
                { label: "multiple_choice", value: "multiple_choice" },
                { label: "matching", value: "matching" },
                { label: "short_answer", value: "short_answer" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Khoảng câu hỏi" required>
            <Space>
              <Form.Item
                name="questionRangeStart"
                noStyle
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="Bắt đầu" min={1} />
              </Form.Item>
              <Form.Item
                name="questionRangeEnd"
                noStyle
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="Kết thúc" min={1} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="instructions" label="Hướng dẫn làm bài">
            <Input.TextArea rows={3} placeholder="Nhập hướng dẫn cho nhóm câu hỏi này" />
          </Form.Item>
          <Form.Item
            name="order"
            label="Thứ tự hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
          >
            <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="contextHtml"
            label="Nội dung chung"
            tooltip="Nhập nội dung HTML cho đoạn văn/ngữ cảnh chung của nhóm câu hỏi. Có thể sử dụng định dạng HTML và tạo bảng."
            valuePropName="value"
            getValueFromEvent={(content) => content}
          >
            <TinyMCEEditor key={`group-${groupDrawerOpen ? (editingGroup && selectedGroup?._id ? selectedGroup._id : 'new') : 'closed'}`} />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              onClick={() => {
                setGroupDrawerOpen(false);
                groupForm.resetFields();
                setEditingGroup(false);
              }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={handleCreateGroup}>
              Lưu nhóm
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Question Modal */}
      <Modal
        title="Thêm câu hỏi"
        open={questionDrawerOpen}
        onCancel={() => {
          setQuestionDrawerOpen(false);
          questionForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" form={questionForm}>
          <Form.Item
            name="questionNumber"
            label="Số câu"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="order"
            label="Thứ tự"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="questionType"
            label="Loại câu hỏi"
            rules={[{ required: true, message: "Vui lòng chọn loại câu hỏi" }]}
          >
            <Select
              placeholder="Chọn loại câu hỏi"
              options={[
                { label: "Điền vào chỗ trống", value: "fill_in_blank" },
                { label: "Trắc nghiệm", value: "multiple_choice" },
                { label: "Câu trả lời ngắn", value: "short_answer" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="questionText"
            label="Nội dung câu hỏi"
            rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
          </Form.Item>
          <Form.Item
            name="correctAnswerValue"
            label="Đáp án đúng"
            rules={[{ required: true, message: "Vui lòng nhập đáp án đúng" }]}
            tooltip="Nhập các đáp án đúng, ngăn cách bằng dấu | (ví dụ: A|B)"
          >
            <Input placeholder="A|B" />
          </Form.Item>
          <Form.Item 
            name="alternatives" 
            label="Đáp án thay thế"
            tooltip="Nhập các đáp án thay thế được chấp nhận, ngăn cách bằng dấu | (tùy chọn)"
          >
            <Input placeholder="Alt1|Alt2" />
          </Form.Item>
          <Form.Item
            name="optionsJson"
            label="Tùy chọn (JSON)"
            tooltip="Nhập danh sách các lựa chọn dưới dạng JSON (chỉ dùng cho câu trắc nghiệm)"
          >
            <Input.TextArea
              rows={3}
              placeholder='[{"key":"A","text":"Lựa chọn A"}, {"key":"B","text":"Lựa chọn B"}]'
            />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              onClick={() => {
                setQuestionDrawerOpen(false);
                questionForm.resetFields();
              }}
            >
              Hủy
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Answer Modal */}
      <Modal
        title="Đáp án / Transcript"
        open={answerDrawerOpen}
        onCancel={() => {
          setAnswerDrawerOpen(false);
          answerForm.resetFields();
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Form layout="vertical" form={answerForm}>
          <Form.Item
            name="partNumber"
            label="Số phần"
            rules={[{ required: true, message: "Vui lòng nhập số phần" }]}
          >
            <InputNumber min={1} placeholder="Ví dụ: 1" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="transcriptHtml"
            label="Nội dung Transcript"
            rules={[{ required: true, message: "Vui lòng nhập nội dung transcript" }]}
            valuePropName="value"
            getValueFromEvent={(content) => content}
            tooltip="Nhập nội dung transcript của phần này. Có thể sử dụng định dạng HTML và tạo bảng."
          >
            <TinyMCEEditor />
          </Form.Item>
          <Form.Item 
            name="audioUrl" 
            label="Đường dẫn Audio"
            tooltip="URL của file audio cho phần này (nếu có)"
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item 
            name="sourceUrl" 
            label="Nguồn tham khảo"
            tooltip="URL nguồn gốc của transcript/đáp án (nếu có)"
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            label="Danh sách đáp án"
            rules={[{ required: true, message: "Vui lòng thêm ít nhất một đáp án" }]}
            tooltip="Thêm đáp án cho từng câu hỏi trong phần này"
          >
            <Form.List name="answerKeys">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 12 }}
                      title={
                        <Space>
                          <Text strong>Đáp án #{name + 1}</Text>
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 16 }}
                          />
                        </Space>
                      }
                    >
                      <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        <Form.Item
                          {...restField}
                          name={[name, "questionNumber"]}
                          label="Số câu hỏi"
                          rules={[
                            { required: true, message: "Vui lòng nhập số câu hỏi" },
                            { type: "number", min: 1, message: "Số câu hỏi phải >= 1" },
                          ]}
                        >
                          <InputNumber
                            placeholder="Ví dụ: 1"
                            min={1}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "correctAnswer"]}
                          label="Đáp án đúng"
                          rules={[
                            { required: true, message: "Vui lòng nhập đáp án đúng" },
                          ]}
                          tooltip="Nhập đáp án đúng cho câu này"
                        >
                          <Input
                            placeholder="Ví dụ: break"
                          />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      size="large"
                    >
                      Thêm đáp án mới
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              onClick={() => {
                setAnswerDrawerOpen(false);
                answerForm.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={handleUpsertAnswer}>
              Lưu đáp án
            </Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}


