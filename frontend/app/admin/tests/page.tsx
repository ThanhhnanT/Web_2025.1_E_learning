"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  Test,
  TestStatus,
  TestType,
  TestSection,
  QuestionGroup,
} from "@/types/test";
import {
  createTest,
  deleteTest,
  fetchAdminTests,
  fetchTestStructure,
  updateTest,
  createSection,
  deleteSection,
  createGroup,
  deleteGroup,
  createQuestion,
  deleteQuestion,
  upsertAnswer,
} from "@/service/tests";

const statusColors: Record<TestStatus, string> = {
  [TestStatus.ACTIVE]: "green",
  [TestStatus.DRAFT]: "orange",
  [TestStatus.ARCHIVED]: "red",
};

const { Title, Text } = Typography;

export default function AdminTestsPage() {
  const router = useRouter();
  const [form] = Form.useForm<Partial<Test>>();
  const [sectionForm] = Form.useForm<any>();
  const [groupForm] = Form.useForm<any>();
  const [questionForm] = Form.useForm<any>();
  const [answerForm] = Form.useForm<any>();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [structure, setStructure] = useState<any | null>(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureLoading, setStructureLoading] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [answerDrawerOpen, setAnswerDrawerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TestSection | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<QuestionGroup | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    search?: string;
    status?: TestStatus | string;
    skill?: string;
  }>({});

  const statusOptions = useMemo(
    () =>
      Object.values(TestStatus).map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
    []
  );

  const loadData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const res = await fetchAdminTests({
        page,
        pageSize,
        search: filters.search,
        status: filters.status,
        skill: filters.skill,
      });

      setTests(res.data || []);
      setPagination({
        current: res.pagination.currentPage,
        pageSize: res.pagination.pageSize,
        total: res.pagination.totalItems,
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách bài test");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, pagination.pageSize);
  }, [filters]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing?._id) {
        await updateTest(editing._id, values);
        message.success("Cập nhật bài test thành công");
      } else {
        await createTest(values);
        message.success("Tạo bài test thành công");
      }
      setDrawerOpen(false);
      setEditing(null);
      form.resetFields();
      await loadData();
    } catch (err) {
      console.error(err);
      message.error("Không thể lưu bài test");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTest(id);
      message.success("Đã xóa bài test");
      loadData();
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa bài test");
    }
  };

  const openEdit = (record: Test) => {
    setEditing(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldValue("status", TestStatus.DRAFT);
    setDrawerOpen(true);
  };

  const openStructure = async (record: Test) => {
    setStructureLoading(true);
    try {
      const res = await fetchTestStructure(record._id);
      setStructure(res);
      setStructureOpen(true);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải cấu trúc bài test");
    } finally {
      setStructureLoading(false);
    }
  };

  const refreshStructure = async () => {
    if (structure?._id) {
      await openStructure(structure as Test);
    }
  };

  const handleCreateSection = async () => {
    if (!structure?._id) return;
    try {
      const values = await sectionForm.validateFields();
      let resources = values.resources;
      if (typeof resources === "string" && resources.trim()) {
        try {
          resources = JSON.parse(resources);
        } catch {
          message.error("Resources JSON không hợp lệ");
          return;
        }
      }
      await createSection(structure._id, {
        ...values,
        resources: resources || {},
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
      let sharedContent = values.sharedContent;
      if (typeof sharedContent === "string" && sharedContent.trim()) {
        try {
          sharedContent = JSON.parse(sharedContent);
        } catch {
          message.error("Shared content JSON không hợp lệ");
          return;
        }
      }
      await createGroup(structure._id, selectedSection._id, {
        ...values,
        sharedContent: sharedContent || {},
        questionRange: [values.questionRangeStart, values.questionRangeEnd],
      });
      message.success("Đã tạo nhóm câu hỏi");
      setGroupDrawerOpen(false);
      groupForm.resetFields();
      await refreshStructure();
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm câu hỏi thất bại");
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
      if (typeof answerKeys === "string") {
        try {
          answerKeys = JSON.parse(answerKeys);
        } catch {
          message.error("answerKeys phải là JSON hợp lệ");
          return;
        }
      }
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

  const columns: ColumnsType<Test> = [
    {
      title: "Tên bài test",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space
          direction="vertical"
          size={2}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/tests/${record._id}`);
          }}
        >
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.series} {record.testNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: "Kỹ năng",
      dataIndex: "skill",
      key: "skill",
      width: 120,
      render: (value) => value || "-",
    },
    {
      title: "Số câu",
      dataIndex: "totalQuestions",
      key: "totalQuestions",
      width: 90,
    },
    {
      title: "Thời lượng",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      width: 110,
      render: (val) => `${val} phút`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (val: TestStatus) => (
        <Tag color={statusColors[val] || "default"}>{val}</Tag>
      ),
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(record);
            }}
          />
          <Popconfirm
            title="Xóa bài test?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record._id);
            }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
                    setGroupDrawerOpen(true);
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
                      <Popconfirm
                        title="Xóa group?"
                        onConfirm={async () => {
                          await deleteGroup(structure._id, s._id, g._id);
                          message.success("Đã xóa group");
                          await refreshStructure();
                        }}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Câu {g.questionRange?.[0]} - {g.questionRange?.[1]} • {g.groupType}
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý bài test
            </Title>
            <Tag color="blue">Admin</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input.Search
              placeholder="Tìm theo tên, series, slug"
              allowClear
              onSearch={(val) => setFilters((f) => ({ ...f, search: val || undefined }))}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              options={statusOptions}
              style={{ width: 140 }}
              onChange={(val) => setFilters((f) => ({ ...f, status: val || undefined }))}
            />
            <Input
              placeholder="Kỹ năng (listening...)"
              allowClear
              style={{ width: 180 }}
              onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value || undefined }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tạo bài test
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={tests}
          loading={loading}
          onRow={(record) => ({
            onClick: () => router.push(`/admin/tests/${record._id}`),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
        />
      </Card>

      <Drawer
        open={drawerOpen}
        width={520}
        title={editing ? "Cập nhật bài test" : "Tạo bài test"}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: TestStatus.DRAFT }}>
          <Form.Item name="title" label="Tên bài test" rules={[{ required: true, message: "Nhập tên bài test" }]}>
            <Input placeholder="Cambridge IELTS 20 Listening Test 1" />
          </Form.Item>
          <Form.Item name="series" label="Series">
            <Input placeholder="Cambridge IELTS 20" />
          </Form.Item>
          <Form.Item name="testNumber" label="Số bài">
            <Input placeholder="Test 1" />
          </Form.Item>
          <Form.Item name="skill" label="Kỹ năng">
            <Input placeholder="listening" />
          </Form.Item>
          <Form.Item name="testType" label="Loại">
            <Select
              allowClear
              options={Object.values(TestType).map((value) => ({ label: value, value }))}
            />
          </Form.Item>
          <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true, message: "Chọn ngôn ngữ" }]}>
            <Select
              options={[
                { label: "English", value: "English" },
                { label: "Chinese", value: "Chinese" },
              ]}
            />
          </Form.Item>
          <Form.Item name="level" label="Level" rules={[{ required: true, message: "Nhập level" }]}>
            <Input placeholder="Intermediate" />
          </Form.Item>
          <Form.Item name="durationMinutes" label="Thời lượng (phút)" rules={[{ required: true, message: "Nhập thời lượng" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="totalQuestions" label="Tổng câu hỏi" rules={[{ required: true, message: "Nhập số câu hỏi" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="externalSlug" label="External slug">
            <Input placeholder="cambridge-ielts-020-listening-test-01" />
          </Form.Item>
          <Form.Item name="sourceUrl" label="Nguồn">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={statusOptions} />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit}>
              Lưu
            </Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        width={640}
        title="Cấu trúc bài test"
        open={structureOpen}
        onClose={() => {
          setStructureOpen(false);
          setStructure(null);
        }}
        loading={structureLoading}
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
      >
        {structure ? (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong>{structure.title}</Text>
            <Text type="secondary">
              {structure.sections?.length || 0} phần • {structure.totalQuestions || "-"} câu
            </Text>
            {renderStructure(structure.sections)}
          </Space>
        ) : (
          <Text type="secondary">Chọn một bài test để xem cấu trúc</Text>
        )}
      </Drawer>

      <Drawer
        width={420}
        title="Thêm section"
        open={sectionDrawerOpen}
        onClose={() => {
          setSectionDrawerOpen(false);
          sectionForm.resetFields();
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={sectionForm}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Part 1" />
          </Form.Item>
          <Form.Item name="sectionType" label="Section type" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "listening", value: "listening" },
                { label: "reading", value: "reading" },
                { label: "writing", value: "writing" },
                { label: "speaking", value: "speaking" },
              ]}
            />
          </Form.Item>
          <Form.Item name="partNumber" label="Part number" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Khoảng câu hỏi" required>
            <Space>
              <Form.Item name="questionRangeStart" noStyle rules={[{ required: true }]}>
                <InputNumber placeholder="Bắt đầu" min={1} />
              </Form.Item>
              <Form.Item name="questionRangeEnd" noStyle rules={[{ required: true }]}>
                <InputNumber placeholder="Kết thúc" min={1} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="order" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="resources" label="Resources (JSON)">
            <Input.TextArea rows={3} placeholder='{"audio": "..."}' />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setSectionDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleCreateSection}>
              Lưu section
            </Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        width={420}
        title="Thêm nhóm câu hỏi"
        open={groupDrawerOpen}
        onClose={() => {
          setGroupDrawerOpen(false);
          groupForm.resetFields();
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={groupForm}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Questions 1-10" />
          </Form.Item>
          <Form.Item name="groupType" label="Loại nhóm" rules={[{ required: true }]}>
            <Select
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
              <Form.Item name="questionRangeStart" noStyle rules={[{ required: true }]}>
                <InputNumber placeholder="Bắt đầu" min={1} />
              </Form.Item>
              <Form.Item name="questionRangeEnd" noStyle rules={[{ required: true }]}>
                <InputNumber placeholder="Kết thúc" min={1} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="instructions" label="Hướng dẫn">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="order" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="sharedContent" label="Shared content (JSON)">
            <Input.TextArea rows={3} placeholder='{"contextHtml": "..."}' />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setGroupDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleCreateGroup}>
              Lưu nhóm
            </Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        width={420}
        title="Thêm câu hỏi"
        open={questionDrawerOpen}
        onClose={() => {
          setQuestionDrawerOpen(false);
          questionForm.resetFields();
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={questionForm}>
          <Form.Item name="questionNumber" label="Số câu" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="order" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="questionType" label="Loại câu" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "fill_in_blank", value: "fill_in_blank" },
                { label: "multiple_choice", value: "multiple_choice" },
                { label: "short_answer", value: "short_answer" },
              ]}
            />
          </Form.Item>
          <Form.Item name="questionText" label="Nội dung" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="correctAnswerValue"
            label="Đáp án (ngăn cách bằng | )"
            rules={[{ required: true }]}
          >
            <Input placeholder="A|B" />
          </Form.Item>
          <Form.Item name="alternatives" label="Đáp án thay thế (|)">
            <Input placeholder="Alt1|Alt2" />
          </Form.Item>
          <Form.Item name="optionsJson" label="Options (JSON, optional)">
            <Input.TextArea rows={3} placeholder='[{"key":"A","text":"..."}, ...]' />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setQuestionDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleCreateQuestion}>
              Lưu câu hỏi
            </Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        width={520}
        title="Đáp án / Transcript"
        open={answerDrawerOpen}
        onClose={() => {
          setAnswerDrawerOpen(false);
          answerForm.resetFields();
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={answerForm}>
          <Form.Item name="partNumber" label="Part number" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="transcriptHtml"
            label="Transcript HTML"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={6} placeholder="<div>...</div>" />
          </Form.Item>
          <Form.Item name="audioUrl" label="Audio URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="sourceUrl" label="Source URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="answerKeys"
            label="answerKeys (JSON array)"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={6}
              placeholder='[{"questionNumber":1,"correctAnswer":["A"],"alternatives":[]}]'
            />
          </Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setAnswerDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleUpsertAnswer}>
              Lưu đáp án
            </Button>
          </Space>
        </Form>
      </Drawer>
    </Space>
  );
}

