import { useState, useEffect } from "react";
import { FlashcardDeck } from "../lib/types";
import { getDeckStorageKey } from "../utils/helpers";

export function useDecks(currentUserId: string | null) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load
  useEffect(() => {
    setIsInitialized(false);
    if (!currentUserId) return;
    const saved = localStorage.getItem(getDeckStorageKey(currentUserId));
    if (saved) {
      try {
        setDecks(JSON.parse(saved));
      } catch (err) {
        console.error("Deck load error:", err);
      }
    }
    setIsInitialized(true);
  }, [currentUserId]);

  // Save
  useEffect(() => {
    if (!currentUserId || !isInitialized) return;
    localStorage.setItem(getDeckStorageKey(currentUserId), JSON.stringify(decks));
  }, [decks, currentUserId, isInitialized]);

  const addDeck = (name: string, description: string) => {
    const newDeck: FlashcardDeck = {
      id: Date.now().toString(),
      name,
      description,
      wordCount: 0,
      createdAt: new Date(),
    };
    setDecks((prev) => [...prev, newDeck]);
  };

  const updateDeck = (id: string, name: string, description: string) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name, description } : d))
    );
  };

  const deleteDeck = (id: string) => {
    if (!currentUserId) return;
    setDecks((prev) => prev.filter((d) => d.id !== id));
    localStorage.removeItem(`flashcard_deck_${currentUserId}_${id}`);
  };

  return { decks, addDeck, updateDeck, deleteDeck };
}