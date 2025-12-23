"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Upload,
  message,
  Space,
  Tag,
  Flex,
  Form,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd/es/upload";
import { getCardsByDeck, updateCard } from "@/service/flashcards";
import type { BackendFlashcard } from "@/types/flashcards";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function CardDetailPage() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<BackendFlashcard | null>(null);
  const [formValues, setFormValues] = useState({
    word: "",
    type: "",
    phonetic: "",
    definition: "",
    example: "",
    image: "",
    audio: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    tags: [] as string[],
  });

  const fetchCard = async () => {
    if (!deckId || !cardId) return;
    try {
      setLoading(true);
      const list = await getCardsByDeck(deckId);
      const found = (list || []).find((c: any) => c._id === cardId);
      if (found) {
        setCard(found);
        setFormValues({
          word: found.word || "",
          type: found.type || "",
          phonetic: found.phonetic || "",
          definition: found.definition || "",
          example: found.example || "",
          image: found.image || "",
          audio: found.audio || "",
          difficulty: (found.difficulty as "easy" | "medium" | "hard") || "medium",
          tags: found.tags || [],
        });
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể tải thẻ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [deckId, cardId]);

  const handleChange = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!deckId || !cardId) return;
    try {
      setLoading(true);
      await updateCard(deckId, cardId, formValues);
      message.success("Đã lưu thay đổi");
      router.push(`/admin/flashcards/${deckId}`);
    } catch (error) {
      console.error(error);
      message.error("Lưu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const breadcrumb = useMemo(() => {
    const shortId = cardId?.slice(-6) || "";
    return `Card #${shortId}`;
  }, [cardId]);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
    showUploadList: false,
    onChange(info) {
      const file = info.file.originFileObj;
      if (file) {
        const url = URL.createObjectURL(file);
        if (info.file.field === "image") {
          handleChange("image", url);
        }
        if (info.file.field === "audio") {
          handleChange("audio", url);
        }
      }
    },
  };

  return (
    <div style={{ padding: 24, background: "#f6f7f8", minHeight: "100vh" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/admin/flashcards/${deckId}`)}>
            Quay lại
          </Button>
          <Text type="secondary">/ Flashcards / {breadcrumb}</Text>
        </Space>

        <Card
          styles={{ body: { padding: 20 } }}
          extra={
            <Space>
              <Tag color="blue">{deckId}</Tag>
              <Tag color="purple">Card #{cardId?.slice(-6)}</Tag>
              <Tag color="gold">Review: {card?.reviewCount ?? 0}</Tag>
            </Space>
          }
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card
                  size="small"
                  title="Hình ảnh"
                  styles={{ body: { padding: 12 } }}
                  bordered
                >
                  <div style={{ width: "100%", aspectRatio: "4 / 3", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                    {formValues.image ? (
                      <img src={formValues.image} alt="card" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Flex align="center" justify="center" style={{ width: "100%", height: "100%", background: "#fafafa" }}>
                        <Text type="secondary">Chưa có ảnh</Text>
                      </Flex>
                    )}
                  </div>
                  <Dragger
                    {...uploadProps}
                    accept="image/*"
                    field="image"
                    style={{ marginTop: 12 }}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Kéo thả hoặc chọn ảnh</p>
                  </Dragger>
                </Card>

                <Card
                  size="small"
                  title="Audio"
                  styles={{ body: { padding: 12 } }}
                  bordered
                >
                  <div style={{ marginBottom: 8 }}>
                    {formValues.audio ? (
                      <audio controls style={{ width: "100%" }} src={formValues.audio}>
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <Text type="secondary">Chưa có audio</Text>
                    )}
                  </div>
                  <Dragger
                    {...uploadProps}
                    accept="audio/*"
                    field="audio"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Kéo thả hoặc chọn audio</p>
                  </Dragger>
                </Card>
              </Space>
            </Col>

            <Col xs={24} md={16}>
              <Form layout="vertical">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Từ">
                      <Input
                        value={formValues.word}
                        onChange={(e) => handleChange("word", e.target.value)}
                        placeholder="Nhập từ"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Loại">
                      <Select
                        value={formValues.type}
                        onChange={(v) => handleChange("type", v)}
                        placeholder="Chọn loại từ"
                        options={[
                          { label: "Noun", value: "noun" },
                          { label: "Verb", value: "verb" },
                          { label: "Adjective", value: "adjective" },
                          { label: "Adverb", value: "adverb" },
                          { label: "Pronoun", value: "pronoun" },
                        ]}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Phiên âm">
                      <Input
                        value={formValues.phonetic}
                        onChange={(e) => handleChange("phonetic", e.target.value)}
                        placeholder="ˈæbsənt"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Độ khó">
                      <Select
                        value={formValues.difficulty}
                        onChange={(v) => handleChange("difficulty", v)}
                        options={[
                          { label: "Dễ", value: "easy" },
                          { label: "Trung bình", value: "medium" },
                          { label: "Khó", value: "hard" },
                        ]}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Định nghĩa">
                  <TextArea
                    rows={3}
                    value={formValues.definition}
                    onChange={(e) => handleChange("definition", e.target.value)}
                    placeholder="Định nghĩa"
                  />
                </Form.Item>

                <Form.Item label="Ví dụ">
                  <TextArea
                    rows={3}
                    value={formValues.example}
                    onChange={(e) => handleChange("example", e.target.value)}
                    placeholder="Ví dụ sử dụng"
                  />
                </Form.Item>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Tags">
                      <Select
                        mode="tags"
                        value={formValues.tags}
                        onChange={(v) => handleChange("tags", v)}
                        placeholder="Nhập tag"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small" styles={{ body: { padding: 12 } }}>
                      <Space direction="vertical">
                        <Text type="secondary">ID Deck</Text>
                        <Tag color="blue">{deckId}</Tag>
                        <Text type="secondary">ID Card</Text>
                        <Tag color="purple">{cardId}</Tag>
                        <Text type="secondary">Review Count</Text>
                        <Text strong>{card?.reviewCount ?? 0}</Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <Flex justify="flex-end" gap={8}>
            <Button icon={<CloseOutlined />} onClick={() => router.push(`/admin/flashcards/${deckId}`)}>
              Hủy
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
              Lưu
            </Button>
          </Flex>
        </Card>
      </Space>
    </div>
  );
}

