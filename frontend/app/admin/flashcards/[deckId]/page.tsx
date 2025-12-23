"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Button,
  Table,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Descriptions,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  createCard,
  deleteCard,
  getCardsByDeckPaged,
  getDeckSummary,
  updateCard,
  updateDeck,
} from "@/service/flashcards";
import type { BackendFlashcard, DeckSummaryResponse, PaginatedResponse } from "@/types/flashcards";
import type { ColumnsType } from "antd/es/table";

const { Title, Text, Paragraph } = Typography;

interface CardFormValues {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image?: string;
  audio?: string;
  tags?: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<DeckSummaryResponse | null>(null);
  const [cards, setCards] = useState<BackendFlashcard[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<BackendFlashcard | null>(null);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckForm] = Form.useForm<{ name: string; description?: string }>();
  const [cardForm] = Form.useForm<CardFormValues>();

  const loadSummary = async () => {
    if (!deckId) return;
    try {
      setLoading(true);
      const res = await getDeckSummary(deckId as string);
      setSummary(res || null);
      if (res?.deck) {
        deckForm.setFieldsValue({ name: res.deck.name, description: res.deck.description });
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể tải thông tin bộ thẻ");
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async (
    page = pagination.page,
    limit = pagination.limit,
    searchTerm = search,
    typeTerm = typeFilter,
  ) => {
    if (!deckId) return;
    try {
      setCardLoading(true);
      const res = (await getCardsByDeckPaged(deckId as string, {
        page,
        limit,
        search: searchTerm,
      })) as PaginatedResponse<BackendFlashcard>;
      const allCards = res?.data || [];
      const filtered = typeTerm ? allCards.filter((c) => c.type?.toLowerCase() === typeTerm.toLowerCase()) : allCards;
      setCards(filtered);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách thẻ");
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadCards();
  }, [deckId]);

  const handleCardSubmit = async () => {
    if (!deckId) return;
    try {
      const values = await cardForm.validateFields();
      const userId = Cookies.get("user_id");
      if (!userId) {
        message.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      if (editingCard?._id) {
        await updateCard(deckId as string, editingCard._id, values);
        message.success("Cập nhật thẻ thành công");
      } else {
        await createCard(deckId as string, { ...values, userId });
        message.success("Thêm thẻ thành công");
      }
      setCardModalOpen(false);
      setEditingCard(null);
      cardForm.resetFields();
      loadSummary();
      loadCards();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      message.error("Không thể lưu thẻ");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!deckId) return;
    try {
      await deleteCard(deckId as string, cardId);
      message.success("Đã xóa thẻ");
      loadSummary();
      loadCards();
    } catch (error) {
      console.error(error);
      message.error("Xóa thẻ thất bại");
    }
  };

  const handleOpenCardModal = (card?: BackendFlashcard) => {
    if (card) {
      setEditingCard(card);
      cardForm.setFieldsValue({
        word: card.word,
        type: card.type,
        phonetic: card.phonetic,
        definition: card.definition,
        example: card.example,
        image: card.image,
        audio: card.audio,
        tags: card.tags || [],
        difficulty: card.difficulty,
      });
    } else {
      setEditingCard(null);
      cardForm.resetFields();
    }
    setCardModalOpen(true);
  };

  const handleDeckUpdate = async () => {
    if (!deckId) return;
    try {
      const values = await deckForm.validateFields();
      await updateDeck(deckId as string, values);
      message.success("Cập nhật bộ thẻ thành công");
      setDeckModalOpen(false);
      loadSummary();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      message.error("Không thể cập nhật bộ thẻ");
    }
  };

  const typeColors: Record<string, string> = {
    noun: "blue",
    verb: "green",
    adjective: "orange",
    adverb: "purple",
    default: "geekblue",
  };

  const columns: ColumnsType<BackendFlashcard> = [
    {
      title: "Từ",
      dataIndex: "word",
      key: "word",
      width: 200,
      ellipsis: true,
      render: (text: string) => <Text strong style={{ wordBreak: "break-word" }}>{text}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type: string) => {
        const color = typeColors[type?.toLowerCase()] || typeColors.default;
        return (
          <Tag color={color} style={{ borderRadius: 999, textTransform: "capitalize" }}>
            {type || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Độ khó",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 120,
      render: (diff?: string) => {
        const colorMap: Record<string, string> = { easy: "green", medium: "gold", hard: "red" };
        return <Tag color={colorMap[diff || "medium"]}>{diff || "medium"}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCardModal(record);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa thẻ?"
            onConfirm={(e) => {
              if (e) e.stopPropagation();
              handleDeleteCard(record._id);
            }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const progressStats = useMemo(() => summary?.stats || null, [summary]);
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set((cards || []).map((c) => c.type).filter(Boolean)));
    return types.map((t) => ({ label: t, value: t }));
  }, [cards]);

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: "100%" }} size={24}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/flashcards")} style={{ width: 140 }}>
          Quay lại
        </Button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220 }}>
            <Title level={2} style={{ margin: 0 }}>
              {summary?.deck?.name || "Đang tải..."}
            </Title>
            <Text type="secondary">{summary?.deck?.description}</Text>
            <Text type="secondary" style={{ fontWeight: 600 }}>
              {summary?.stats?.wordCount ?? 0} Cards
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { loadSummary(); loadCards(); }}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCardModal()}>
              Thêm thẻ
            </Button>
            <Button onClick={() => setDeckModalOpen(true)} icon={<EditOutlined />}>
              Sửa bộ thẻ
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {summary ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card>
                  <Space direction="vertical">
                    <Text type="secondary">Tổng số từ</Text>
                    <Title level={3} style={{ margin: 0 }}>
                      {summary.stats.wordCount}
                    </Title>
                    <Space>
                      <BookOutlined /> <Text>Tổng số thẻ</Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Space direction="vertical">
                    <Text type="secondary">Người dùng</Text>
                    <Title level={3} style={{ margin: 0 }}>
                      {summary.stats.userCount}
                    </Title>
                    <Space>
                      <TeamOutlined /> <Text>Đã tham gia</Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Space direction="horizontal" split={<span style={{ color: "#e5e7eb" }}>|</span>} align="center">
                    <Space direction="vertical">
                      <Text type="secondary">Đã học</Text>
                      <Title level={4} style={{ margin: 0 }}>
                        {progressStats?.learned || 0}
                      </Title>
                    </Space>
                    <Space direction="vertical">
                      <Text type="secondary">Nhớ</Text>
                      <Title level={4} style={{ margin: 0 }}>
                        {progressStats?.remembered || 0}
                      </Title>
                    </Space>
                    <Space direction="vertical">
                      <Text type="secondary">Ôn lại</Text>
                      <Title level={4} style={{ margin: 0 }}>
                        {progressStats?.review || 0}
                      </Title>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Spin>

        <Card
          title="Danh sách thẻ"
          extra={
            <Space wrap>
              <Input
                placeholder="Tìm kiếm từ vựng"
                prefix={<SearchOutlined />}
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={() => loadCards(1, pagination.limit, search, typeFilter)}
                style={{ width: 240 }}
              />
              <Select
                allowClear
                placeholder="Lọc theo loại"
                options={typeOptions}
                value={typeFilter}
                style={{ width: 160 }}
                onChange={(v) => {
                  setTypeFilter(v);
                  loadCards(1, pagination.limit, search, v);
                }}
              />
              <Button type="primary" onClick={() => loadCards(1, pagination.limit, search, typeFilter)}>
                Áp dụng
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={cards}
            columns={columns}
            rowKey="_id"
            loading={cardLoading}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => router.push(`/admin/flashcards/${deckId}/cards/${record._id}`),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => loadCards(page, pageSize),
            }}
          />
        </Card>

        <Card title="Tiến độ chi tiết">
          {summary?.progress ? (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Học">{summary.progress.learned}</Descriptions.Item>
              <Descriptions.Item label="Nhớ">{summary.progress.remembered}</Descriptions.Item>
              <Descriptions.Item label="Ôn lại">{summary.progress.review}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái từng từ">
                {summary.progress.wordStatus && Object.keys(summary.progress.wordStatus).length > 0 ? (
                  <Space wrap>
                    {Object.entries(summary.progress.wordStatus).map(([word, status]) => (
                      <Tag key={word} color={status === "remembered" ? "green" : status === "review" ? "orange" : "blue"}>
                        {word}: {status}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Chưa có dữ liệu trạng thái từ</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="Chưa có tiến độ cho bộ thẻ này" />
          )}
        </Card>
      </Space>

      <Modal
        open={cardModalOpen}
        title={editingCard ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"}
        onCancel={() => setCardModalOpen(false)}
        onOk={handleCardSubmit}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
        width={720}
      >
        <Form layout="vertical" form={cardForm}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="word" label="Từ vựng" rules={[{ required: true, message: "Nhập từ vựng" }]}>
                <Input placeholder="absent" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Loại từ" rules={[{ required: true, message: "Nhập loại từ" }]}>
                <Input placeholder="noun/verb/adj" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phonetic" label="Phiên âm" rules={[{ required: true, message: "Nhập phiên âm" }]}>
                <Input placeholder="ˈæbsənt" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="difficulty" label="Độ khó">
                <Select
                  options={[
                    { label: "Dễ", value: "easy" },
                    { label: "Trung bình", value: "medium" },
                    { label: "Khó", value: "hard" },
                  ]}
                  placeholder="Chọn độ khó"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="definition" label="Định nghĩa" rules={[{ required: true, message: "Nhập định nghĩa" }]}>
            <Input.TextArea rows={3} placeholder="Định nghĩa ngắn gọn" />
          </Form.Item>
          <Form.Item name="example" label="Ví dụ" rules={[{ required: true, message: "Nhập ví dụ" }]}>
            <Input.TextArea rows={3} placeholder="Ví dụ sử dụng từ" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="image" label="URL hình ảnh">
                <Input placeholder="https://example.com/image.jpg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="audio" label="URL audio">
                <Input placeholder="https://example.com/audio.mp3" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Nhập tag và nhấn Enter" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deckModalOpen}
        title="Chỉnh sửa bộ thẻ"
        onCancel={() => setDeckModalOpen(false)}
        onOk={handleDeckUpdate}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={deckForm}>
          <Form.Item name="name" label="Tên bộ thẻ" rules={[{ required: true, message: "Nhập tên bộ thẻ" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

