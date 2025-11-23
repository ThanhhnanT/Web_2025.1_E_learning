"use client";

import React from "react";
import Link from "next/link";
import { Card, Avatar, Tag, Button } from "antd";
import { CopyOutlined, EditOutlined } from "@ant-design/icons";
import styles from "@/styles/flashcardItem.module.css";

interface FlashCardProps {
  href: string;
  title: string;
  wordCount: number;
  userCount: number;
  userAvatar: string;
  username: string;
}

const TermListItem: React.FC<FlashCardProps> = ({
  href,
  title,
  wordCount,
  userCount,
  userAvatar,
  username,
}) => {
  return (
      <Card className={styles.card} hoverable>
        <h3 className={styles.title}>{title}</h3>

        {/* Info */}
        <p className={styles.info}>
          <CopyOutlined /> {wordCount} từ &nbsp; | &nbsp;
          <EditOutlined /> {userCount}
        </p>

        {/* Description */}
        <p className={styles.desc}>Flashcards tổng hợp bởi người dùng</p>

        {/* Tags */}
        <div className={styles.tags}>
          <Tag color="blue" className={styles.tag}>#Flashcards</Tag>
          <Tag color="blue" className={styles.tag}>#{username}</Tag>
        </div>

        {/* User */}
        <div className={styles.userRow}>
          <Avatar
            src={userAvatar}
            size={40}
            style={{
              overflow: "hidden",
            }}
          >
            <img
              src={userAvatar}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",   
              }}
            />
          </Avatar>

          <span className={styles.username}>{username}</span>
        </div>

        {/* Button */}
        <Button type="default" className={styles.detailBtn}>
          Chi tiết
        </Button>
      </Card>
  );
};

export default TermListItem;
