"use client";

import React from "react";
import { Alert, Collapse } from "antd";
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
        message={
          <div className={styles.alertContent}>
            Chú ý: Bạn có thể tạo flashcards từ highlights trong trang chi tiết.
            <Collapse
              bordered={false}
              style={{ marginTop: 10 }}
              items={[
                {
                  key: "1",
                  label: "Xem hướng dẫn",
                  children: (
                    <iframe
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/RGNMCXzvt4s"
                      allowFullScreen
                    ></iframe>
                  ),
                },
              ]}
            />
          </div>
        }
        className={styles.alert}
      />
    </>
  );
};