"use client";

import React from "react";
import { Alert } from "antd";
import { ThunderboltOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import styles from "@/styles/flashcardPage.module.css";
import { useRouter, usePathname } from "next/navigation";

export const HeaderSection = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: "/flashcards", label: "List từ của tôi" },
    { key: "/flashcards/discover", label: "Khám phá" },
  ];

  const isActive = (tabKey: string) => {
    if (tabKey === "/flashcards") {
      return pathname === "/flashcards";
    }
    return pathname === tabKey;
  };

    return (
    <>
      <h1 className={styles.title}>
        <ThunderboltOutlined /> Flashcards
      </h1>

      {/* 3 NÚT */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(tab.key)}
            className={`${styles.tabButton} ${
              isActive(tab.key) ? styles.active : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ALERT */}
      <Alert
        type="info"
        icon={<ExclamationCircleOutlined />}
        message="Chú ý: Bạn có thể tạo flashcards từ highlights trong trang chi tiết."
        className={styles.alert}
      />
    </>
  );
};