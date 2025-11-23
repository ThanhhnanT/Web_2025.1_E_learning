// src/app/flashcards/lists/[deckId]/ManagementModals.tsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, List, Popconfirm, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Word } from "./utils";

interface Props {
  open: boolean;
  cards: Word[];
  onClose: () => void;
  onSave: (cards: Word[]) => void;
}

export const ManagementModals: React.FC<Props> = ({ open, cards, onClose, onSave }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [form] = Form.useForm();

  // Mở form thêm/sửa
  const handleOpenForm = (word?: Word) => {
    setEditingWord(word || null);
    form.setFieldsValue(word || { word: "", definition: "", type: "", phonetic: "", example: "" });
    setIsFormOpen(true);
  };

  // Lưu từ (Thêm mới hoặc Update)
  const handleFormSubmit = (values: Word) => {
    let newCards = [...cards];
    if (editingWord) {
      newCards = newCards.map(c => c.word === editingWord.word ? { ...values, image: c.image, audio: c.audio } : c);
      message.success("Đã cập nhật từ vựng");
    } else {
      newCards.push({ ...values, image: "", audio: "" });
      message.success("Đã thêm từ mới");
    }
    onSave(newCards);
    setIsFormOpen(false);
  };

  // Xóa từ
  const handleDelete = (item: Word) => {
    const newCards = cards.filter(c => c.word !== item.word);
    onSave(newCards);
    message.success("Đã xóa từ vựng");
  };

  return (
    <>
      <Modal title="Quản lý danh sách từ" open={open} onCancel={onClose} footer={null} width={600}>
        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => handleOpenForm()} className="mb-4">
          Thêm từ mới
        </Button>
        <List
          pagination={{ pageSize: 5, size: "small" }}
          dataSource={cards}
          renderItem={(item) => (
            <List.Item actions={[
              <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleOpenForm(item)} />,
              <Popconfirm title="Xóa từ này?" onConfirm={() => handleDelete(item)} okButtonProps={{ danger: true }}>
                <Button key="del" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ]}>
              <List.Item.Meta title={<b>{item.word}</b>} description={item.definition} />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={editingWord ? "Sửa từ vựng" : "Thêm từ mới"}
        open={isFormOpen}
        onOk={form.submit}
        onCancel={() => setIsFormOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <div className="grid grid-cols-2 gap-2">
            <Form.Item name="word" label="Từ vựng" rules={[{ required: true }]}>
              <Input placeholder="VD: Hello" />
            </Form.Item>
            <Form.Item name="phonetic" label="Phiên âm">
              <Input placeholder="VD: /həˈləʊ/" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-4 gap-2">
             <Form.Item name="type" label="Loại từ" className="col-span-1">
              <Input placeholder="n." />
            </Form.Item>
             <Form.Item name="definition" label="Định nghĩa" rules={[{ required: true }]} className="col-span-3">
              <Input placeholder="Nghĩa của từ" />
            </Form.Item>
          </div>
          <Form.Item name="example" label="Ví dụ">
            <Input.TextArea rows={2} placeholder="Câu ví dụ..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};