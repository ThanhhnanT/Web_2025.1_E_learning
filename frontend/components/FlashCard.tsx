"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Tag, Button } from "antd";
import { CopyOutlined, EditOutlined } from "@ant-design/icons";
import { checkAuth } from "@/lib/helper";
import AuthModal from "@/components/auth/ModalAuth";
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
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent onClick from firing
    if (!href) return;
    
    if (checkAuth()) {
      // Pass title as URL param instead of localStorage
      const urlWithTitle = href.includes('?') 
        ? `${href}&title=${encodeURIComponent(title)}`
        : `${href}?title=${encodeURIComponent(title)}`;
      router.push(urlWithTitle);
    } else {
      // Store redirect in state instead of localStorage
      setAuthModalOpen(true);
      // Store redirect URL in a ref or state for use after auth
      (window as any).__pendingRedirect = href;
    }
  };

  return (
    <>
      <Card 
        className={styles.card} 
        hoverable
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
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
      <AuthModal
        visible={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        setOpen={(open: boolean) => {
          setAuthModalOpen(open);
          if (!open && checkAuth()) {
            const redirect = (window as any).__pendingRedirect;
            if (redirect) {
              delete (window as any).__pendingRedirect;
              // Pass title as URL param
              const urlWithTitle = redirect.includes('?') 
                ? `${redirect}&title=${encodeURIComponent(title)}`
                : `${redirect}?title=${encodeURIComponent(title)}`;
              router.push(urlWithTitle);
            }
          }
        }}
      />
    </>
  );
};

export default TermListItem;
