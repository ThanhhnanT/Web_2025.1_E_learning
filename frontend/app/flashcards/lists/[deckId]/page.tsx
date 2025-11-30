"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Empty } from "antd";
import { SettingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import WordDetail from "@/components/WordDetail"; // Component gốc của bạn
import { getUserId, getDeckData, saveDeckData, Word } from "./utils";
import { ManagementModals } from "./ManagementModal";

const ListsPage = () => {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;
  const [userId, setUserId] = useState<string | null>(null);

  const [data, setData] = useState<Word[]>([]);
  const [title, setTitle] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get User ID on mount
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (userId && deckId) {
        try {
          const { title, cards } = await getDeckData(userId, deckId);
          setTitle(title);
          setData(cards);
        } catch (error) {
          console.error("Error loading deck data:", error);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [userId, deckId]);

  // Handle Save from Modal
  const handleSaveData = async (newCards: Word[]) => {
    if (userId) {
      try {
        await saveDeckData(userId, deckId, newCards);
        setData(newCards); // Cập nhật UI WordDetail ngay lập tức
      } catch (error) {
        console.error("Error saving deck data:", error);
      }
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Quay lại</Button>
        <Button type="primary" icon={<SettingOutlined />} onClick={() => setIsManageOpen(true)}>
          Quản lý / Thêm từ
        </Button>
      </div>

      {/* Hiển thị WordDetail nếu có dữ liệu */}
      {data.length > 0 ? (
        <WordDetail 
          data={data} 
          title={title} 
          href={`/flashcards/lists/${deckId}`}
          deckId={deckId}
        />
      ) : (
        <Empty description="Danh sách trống" className="mt-20">
          <Button type="primary" onClick={() => setIsManageOpen(true)}>
            Thêm từ vựng đầu tiên
          </Button>
        </Empty>
      )}

      {/* Modal Quản lý (Thêm/Sửa/Xóa) */}
      <ManagementModals
        open={isManageOpen}
        cards={data}
        onClose={() => setIsManageOpen(false)}
        onSave={handleSaveData}
      />
    </div>
  );
};

export default ListsPage;