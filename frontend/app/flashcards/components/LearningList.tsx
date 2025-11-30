"use client";

import React, { useEffect, useState } from "react";
import TermListItem from "@/components/FlashCard";
import { Row, Col, Empty, Spin } from "antd";

interface FlashCardSet {
  id: string;
  title: string;       // Key để check localStorage
  wordCount: number;
  userCount: number;
  userAvatar: string;
  username: string;
  href: string;        // Đường dẫn tới WordDetail
}

interface LearningListProps {
  allFlashcards: FlashCardSet[]; // Danh sách bộ từ có trong hệ thống
}

const LearningList: React.FC<LearningListProps> = ({ allFlashcards }) => {
  const [learningItems, setLearningItems] = useState<FlashCardSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const filterLearningCards = () => {
      const activeList = allFlashcards.filter((card) => {
        const STORAGE_KEY = `flashcard_progress_${card.title.replace(/\s+/g, "_").toLowerCase()}`;
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return false;

        try {
          const parsed = JSON.parse(saved);
          // Xử lý cả 2 trường hợp cấu trúc lưu (stats nằm trong hoặc nằm ngoài)
          const stats = parsed.stats || parsed;

          if (!stats) return false;

          // ĐIỀU KIỆN ĐANG HỌC: Có ít nhất 1 từ đã học, đã nhớ hoặc cần ôn
          const isLearning =
            (stats.learned || 0) > 0 ||
            (stats.remembered || 0) > 0 ||
            (stats.review || 0) > 0;

          return isLearning;
        } catch (e) {
          console.error("Lỗi parse data flashcard:", card.title, e);
          return false;
        }
      });

      setLearningItems(activeList);
      setLoading(false);
    };

    filterLearningCards();
  }, [allFlashcards]);

  if (loading) {
    return <div className="text-center py-10"><Spin size="large" /></div>;
  }

  if (learningItems.length === 0) {
    // Có thể return null nếu muốn ẩn hoàn toàn section này khi chưa học gì
    return (
        <div className="py-8">
            <h2 className="text-xl font-bold mb-4">Đang học</h2>
            <Empty description="Bạn chưa học bộ từ vựng nào." />
        </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">Đang học ({learningItems.length})</h2>
      
      <Row gutter={[16, 16]}>
        {learningItems.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <div onClick={() => window.location.href = item.href}>
                <TermListItem
                href={item.href}
                title={item.title}
                wordCount={item.wordCount}
                userCount={item.userCount}
                userAvatar={item.userAvatar}
                username={item.username}
                />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default LearningList;