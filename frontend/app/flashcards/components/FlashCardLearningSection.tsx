"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { RightOutlined, LoadingOutlined } from "@ant-design/icons";
import { Empty, Spin } from "antd";
import FlashCard from "@/components/FlashCard";
import styles from "@/styles/flashcardPage.module.css";
import { FlashCardItem } from "../lib/types";

interface Props {
  data: FlashCardItem[];
  onItemClick: (href: string, title: string) => void;
}

export const LearningSection = React.memo(({ data, onItemClick }: Props) => {
  const [learningItems, setLearningItems] = useState<FlashCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateActiveItems = () => {
      if (!data || data.length === 0) {
        setLearningItems([]);
        setIsLoading(false);
        return;
      }

      // Use progress data from API (learned, remembered, needReview) instead of localStorage
      // Show decks that have progress (even if all values are 0) or have any progress > 0
      const activeList: FlashCardItem[] = data.filter(item => {
        const hasProgressRecord = item.hasProgress === true;
        const hasActiveProgress =
          (item.learned || 0) > 0 ||
          (item.remembered || 0) > 0 ||
          (item.needReview || 0) > 0;
        return hasProgressRecord || hasActiveProgress;
      });

      setLearningItems(activeList);
      setIsLoading(false);
    };

    calculateActiveItems();

  }, [data]);

  if (isLoading) {
    return (
      <div className={styles.section} style={{ minHeight: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }
  if (learningItems.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Đang học:</h2>
        </div>
        <Empty description="Chưa có bộ từ nào đang học" className="mt-10" />
      </div>
    );
  }
  
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Đang học ({learningItems.length}):</h2>
        <Link href="/flashcards/all" className={styles.viewAll}>
          Xem tất cả <RightOutlined />
        </Link>
      </div>

      {/* Grid Layout */}
      <div
        style={{
          marginTop: 30,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Responsive Grid
          gap: 20,
        }}
      >
        {learningItems.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            onClick={() => onItemClick(item.href, item.title)}
            style={{ cursor: "pointer" }}
          >
            <FlashCard 
              {...item}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

LearningSection.displayName = "LearningSection";