import React, { useState, useEffect } from "react";
import { Modal, Input } from "antd";
import { FlashcardDeck } from "../lib/types";

interface Props {
  isModalVisible: boolean;
  editingDeck: FlashcardDeck | null;
  // Bỏ form và setForm từ props
  onSubmit: (name: string, description: string) => void; 
  onCancel: () => void;
  
  deleteModalVisible: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

// Dùng React.memo để Modal không bị re-render thừa
export const DeckModals: React.FC<Props> = React.memo(({
  isModalVisible,
  editingDeck,
  onSubmit,
  onCancel,
  deleteModalVisible,
  onConfirmDelete,
  onCancelDelete,
}) => {
  // ✅ Tối ưu: State nằm nội bộ tại đây, không gây re-render trang cha khi gõ phím
  const [localName, setLocalName] = useState("");
  const [localDesc, setLocalDesc] = useState("");

  // Reset form khi mở/đóng hoặc chuyển chế độ edit
  useEffect(() => {
    if (isModalVisible) {
      setLocalName(editingDeck?.name || "");
      setLocalDesc(editingDeck?.description || "");
    } else {
        // Clear form khi đóng để tránh lag lần mở sau
        setLocalName("");
        setLocalDesc("");
    }
  }, [isModalVisible, editingDeck]);

  const handleOk = () => {
    // Validate tại chỗ
    if (!localName.trim()) return alert("Vui lòng nhập tên list từ!");
    
    // Chỉ gửi dữ liệu lên cha khi bấm OK
    onSubmit(localName, localDesc);
  };

  return (
    <>
      <Modal
        title={editingDeck ? "Chỉnh sửa List từ" : "Tạo List từ mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={onCancel}
        destroyOnClose={true} // Giúp giải phóng bộ nhớ DOM khi đóng
      >
        <Input
          placeholder="Tên list từ *"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          className="mb-3"
        />
        <Input.TextArea
          placeholder="Mô tả (không bắt buộc)"
          rows={3}
          style={{ marginTop: 12 }}
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
        />
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={deleteModalVisible}
        onOk={onConfirmDelete}
        onCancel={onCancelDelete}
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa list này?</p>
      </Modal>
    </>
  );
});

DeckModals.displayName = "DeckModals";