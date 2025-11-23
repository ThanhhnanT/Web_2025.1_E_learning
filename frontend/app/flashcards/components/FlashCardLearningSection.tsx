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

const getStorageKey = (title: string) => 
  `flashcard_progress_${title.trim().replace(/\s+/g, "_").toLowerCase()}`;

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

      const activeList: FlashCardItem[] = [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const key = getStorageKey(item.title);
        const saved = localStorage.getItem(key);
        if (!saved) continue;

        try {
          const parsed = JSON.parse(saved);
          const stats = parsed.stats || parsed;

          if (!stats) continue;
          const isLearning =
            (stats.learned || 0) > 0 ||
            (stats.remembered || 0) > 0 ||
            (stats.review || 0) > 0;

          if (isLearning) {
            activeList.push(item);
          }
        } catch (e) {
          console.warn("Corrupt flashcard data:", item.title);
        }
      }

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
    return null;
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