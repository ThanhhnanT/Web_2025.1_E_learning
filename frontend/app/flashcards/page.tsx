"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Empty } from "antd";
import styles from "@/styles/flashcardPage.module.css";
import { FlashcardDeck } from "./lib/types";
import { useFlashcardData } from "./hooks/useFlashcardData";
import { useDecks } from "./hooks/useDeck";

// Components
import { HeaderSection } from "./components/FlashCardHeaderSection";
import { LearningSection } from "./components/FlashCardLearningSection";
import { UserDeckSection } from "./components/UserDeckSection";
import { DeckModals } from "./components/DeckModals";
import FlashCard from "@/components/FlashCard";

function FlashcardPage() {
  const router = useRouter();


  const { data, globalProgress, currentUserId, loading } = useFlashcardData();
  const { decks, addDeck, updateDeck, deleteDeck } = useDecks(currentUserId);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  const handleFlashcardClick = useCallback((href: string, title: string) => {
    router.push(`/flashcards/${href}?title=${encodeURIComponent(title)}`);
  }, [router]);

  const handleDeckClick = useCallback((deckId: string) => {
    router.push(`/flashcards/lists/${deckId}`);
  }, [router]);

  const handleCreateDeck = useCallback(() => {
    if (!currentUserId) return alert("Vui lòng đăng nhập để tạo list từ"); 
    setEditingDeck(null);
    setIsModalVisible(true);
  }, [currentUserId]);

  const handleEditDeck = useCallback((deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeck(deck);
    setIsModalVisible(true);
  }, []);

  const handleDeleteDeck = useCallback((deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToDelete(deck.id);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deckToDelete) deleteDeck(deckToDelete);
    setDeleteModalVisible(false);
    setDeckToDelete(null);
  }, [deckToDelete, deleteDeck]);

  const handleSubmit = useCallback((name: string, description: string) => {
    if (!currentUserId) return alert("Chưa đăng nhập");

    if (editingDeck) {
      updateDeck(editingDeck.id, name, description);
    } else {
      addDeck(name, description);
    }
    
    setIsModalVisible(false);
    setEditingDeck(null);
  }, [currentUserId, editingDeck, updateDeck, addDeck]);

  return (
    <div className={styles.container}>
      <HeaderSection />

      {/* LearningSection */}
      <LearningSection 
        data={data} 
        onItemClick={handleFlashcardClick} 
      />

      {/* Sample Decks Section - only show if not loading and have data */}
      {!loading && data.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Khám phá ({data.length}):</h2>
          </div>
          <div
            style={{
              marginTop: 30,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 20,
            }}
          >
            {data.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                onClick={() => handleFlashcardClick(item.href, item.title)}
                style={{ cursor: "pointer" }}
              >
                <FlashCard {...item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no data */}
      {!loading && data.length === 0 && (
        <div className={styles.section}>
          <Empty description="Không có bộ từ vựng nào" className="mt-20" />
        </div>
      )}

      <UserDeckSection
        decks={decks}
        onCreate={handleCreateDeck}
        onEdit={handleEditDeck}
        onDelete={handleDeleteDeck}
        onDeckClick={handleDeckClick}
      />

      <DeckModals
        isModalVisible={isModalVisible}
        editingDeck={editingDeck}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingDeck(null);
        }}
        deleteModalVisible={deleteModalVisible}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setDeleteModalVisible(false)}
      />
    </div>
  );
}

export default FlashcardPage;