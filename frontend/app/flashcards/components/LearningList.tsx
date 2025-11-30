"use client";

import React, { useEffect, useState } from "react";
import TermListItem from "@/components/FlashCard";
import { Row, Col, Empty, Spin } from "antd";
import { getAllProgress } from "@/service/flashcards";
import { getUserId } from "@/lib/helper";

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
    const filterLearningCards = async () => {
      const userId = getUserId();
      let progressMap = new Map<string, { learned: number; remembered: number; review: number }>();

      // Try to get progress from API if user is logged in
      if (userId) {
        try {
          const progressList = await getAllProgress(userId);
          if (Array.isArray(progressList)) {
            progressList.forEach((p: any) => {
              const deckId = typeof p.deckId === 'string' ? p.deckId : p.deckId?._id;
              if (deckId) {
                progressMap.set(deckId, {
                  learned: p.learned || 0,
                  remembered: p.remembered || 0,
                  review: p.review || 0,
                });
              }
            });
          }
        } catch (error) {
          console.error("Error loading progress from API, falling back to localStorage:", error);
        }
      }

      const activeList = allFlashcards.filter((card) => {
        // Try to get progress from API first (if we have deckId in card)
        // For now, we'll check both API and localStorage for backward compatibility
        let isLearning = false;

        // Check API progress if we have deckId (extract from href or card.id)
        if (card.id) {
          const progress = progressMap.get(card.id);
          if (progress) {
            isLearning = (progress.learned || 0) > 0 ||
                        (progress.remembered || 0) > 0 ||
                        (progress.review || 0) > 0;
            if (isLearning) return true;
          }
        }

        // Fallback to localStorage for backward compatibility
        const STORAGE_KEY = `flashcard_progress_${card.title.replace(/\s+/g, "_").toLowerCase()}`;
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return false;

        try {
          const parsed = JSON.parse(saved);
          const stats = parsed.stats || parsed;

          if (!stats) return false;

          isLearning =
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