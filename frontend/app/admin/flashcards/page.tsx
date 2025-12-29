"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Empty,
  Pagination,
  Tooltip,
  Spin,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  createDeck,
  deleteDeck,
  getDecksPaged,
  updateDeck,
} from "@/service/flashcards";
import type { BackendFlashcardDeck, PaginatedResponse } from "@/types/flashcards";

const { Title, Text, Paragraph } = Typography;

interface DeckFormValues {
  name: string;
  description?: string;
}

export default function AdminFlashcardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<BackendFlashcardDeck[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<BackendFlashcardDeck | null>(null);
  const [form] = Form.useForm<DeckFormValues>();

  const loadDecks = async (page = pagination.page, limit = pagination.limit, searchTerm = search) => {
    try {
      setLoading(true);
      const res = (await getDecksPaged({ page, limit, search: searchTerm })) as PaginatedResponse<BackendFlashcardDeck>;
      setDecks(res?.data || []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      message.error("Không thể tải danh sách bộ thẻ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleSearch = () => {
    loadDecks(1, pagination.limit, search);
  };

  const handleOpenCreate = () => {
    setEditingDeck(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (deck: BackendFlashcardDeck) => {
    setEditingDeck(deck);
    form.setFieldsValue({ name: deck.name, description: deck.description });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const userId = Cookies.get("user_id");
      if (!userId) {
        message.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      if (editingDeck?._id) {
        await updateDeck(editingDeck._id, values);
        message.success("Cập nhật bộ thẻ thành công");
      } else {
        await createDeck({ ...values, createdBy: userId });
        message.success("Tạo bộ thẻ thành công");
      }
      setModalOpen(false);
      loadDecks();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      message.error("Thao tác không thành công");
    }
  };

  const handleDelete = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      message.success("Đã xóa bộ thẻ");
      loadDecks();
    } catch (error) {
      console.error(error);
      message.error("Xóa bộ thẻ thất bại");
    }
  };

  const renderDeckCard = (deck: BackendFlashcardDeck) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={deck._id}>
      <Card
        hoverable
        variant="outlined"
        styles={{ body: { display: "flex", flexDirection: "column", gap: 12, height: "100%" } }}
        onClick={() => router.push(`/admin/flashcards/${deck._id}`)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
          <Text strong style={{ fontSize: 18, wordBreak: "break-word" }}>{deck.name}</Text>
          <Tag color="purple" style={{ borderRadius: 999, marginLeft: "auto" }}>
            Bộ thẻ
          </Tag>
        </div>
        <Text type="secondary">{deck.wordCount} Thẻ</Text>
        <Paragraph
          ellipsis={{ rows: 3 }}
          style={{ marginBottom: 0, wordBreak: "break-word", flex: 1 }}
        >
          {deck.description || "Chưa có mô tả"}
        </Paragraph>
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(deck);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bộ thẻ?"
            description="Hành động này sẽ ẩn bộ thẻ khỏi danh sách."
            onConfirm={(e) => {
              if (e) e.stopPropagation();
              handleDelete(deck._id);
            }}
          >
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
          <Button
            type="primary"
            ghost
            style={{ marginLeft: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/flashcards/${deck._id}`);
            }}
          >
            Quản lý thẻ
          </Button>
        </div>
      </Card>
    </Col>
  );

  const hasData = useMemo(() => (decks || []).length > 0, [decks]);

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: "100%" }} size={24}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Quản lý thẻ ghi nhớ
            </Title>
            <Text type="secondary">Quản lý bộ thẻ, thêm mới và chỉnh sửa.</Text>
          </div>
          <Space>
            <Input
              placeholder="Tìm kiếm bộ thẻ..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Thêm bộ thẻ
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {hasData ? (
            <>
              <Row gutter={[16, 16]}>
                {decks.map(renderDeckCard)}
              </Row>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <Pagination
                  current={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  onChange={(page, pageSize) => loadDecks(page, pageSize)}
                  showSizeChanger
                  pageSizeOptions={["6", "12", "24", "48"]}
                />
              </div>
            </>
          ) : (
            <Empty description="Chưa có bộ thẻ" />
          )}
        </Spin>
      </Space>

      <Modal
        open={modalOpen}
        title={editingDeck ? "Chỉnh sửa bộ thẻ" : "Tạo bộ thẻ mới"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên bộ thẻ"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên bộ thẻ" }]}
          >
            <Input placeholder="Ví dụ: IELTS Vocabulary" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

