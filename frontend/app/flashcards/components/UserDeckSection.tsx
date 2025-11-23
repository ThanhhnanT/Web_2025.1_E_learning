import React from "react";
import { Card, Button, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "@/styles/flashcardPage.module.css";
import { FlashcardDeck } from "@/app/flashcards/lib/types";

interface Props {
  decks: FlashcardDeck[];
  onCreate: () => void;
  onEdit: (deck: FlashcardDeck, e: React.MouseEvent) => void;
  onDelete: (deck: FlashcardDeck, e: React.MouseEvent) => void;
  onDeckClick: (id: string) => void;
}

export const UserDeckSection: React.FC<Props> = ({ decks, onCreate, onEdit, onDelete, onDeckClick }) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>List từ đã tạo:</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className={styles.createButton}
          onClick={onCreate}
        >
          Tạo list từ
        </Button>
      </div>

      {decks.length > 0 ? (
        <div style={{
          marginTop: 30,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Responsive Grid
          gap: 20,
        }}>
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className={styles.deckCard}
              onClick={() => onDeckClick(deck.id)}
              hoverable
            >
              <div className={styles.deckHeader}>
                <h3>{deck.name}</h3>
                <div className={styles.deckActions}>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={(e) => onEdit(deck, e)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={(e) => onDelete(deck, e)}
                  />
                </div>
              </div>

              {deck.description && <p>{deck.description}</p>}

              <div className={styles.deckFooter}>
                <Tag>{deck.wordCount} từ</Tag>
                <span>{new Date(deck.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={styles.emptyState}>
          <p>Chưa có list từ nào.</p>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Tạo list từ đầu tiên
          </Button>
        </Card>
      )}
    </div>
  );
};