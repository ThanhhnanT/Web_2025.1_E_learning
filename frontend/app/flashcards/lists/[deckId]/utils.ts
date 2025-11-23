// src/app/flashcards/lists/[deckId]/utils.ts
import Cookies from "js-cookie";

export interface Word {
  id?: string;
  word: string; type: string; phonetic: string; definition: string; example: string; image: string; audio: string;
}

export const getUserId = () => {
  try {
    const token = Cookies.get("access_token");
    if (!token) return Cookies.get("user_id");
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sud;
  } catch { return null; }
};

export const getDeckData = (userId: string, deckId: string) => {
  // Lấy Title
  let title = "";
  const decks = JSON.parse(localStorage.getItem(`flashcard_decks_${userId}`) || "[]");
  const deck = decks.find((d: any) => d.id === deckId);
  if (deck) title = deck.name;

  // Lấy Cards
  const cards = JSON.parse(localStorage.getItem(`flashcard_deck_${userId}_${deckId}`) || "[]");
  return { title, cards };
};

export const saveDeckData = (userId: string, deckId: string, newCards: Word[]) => {
  // 1. Lưu Cards
  localStorage.setItem(`flashcard_deck_${userId}_${deckId}`, JSON.stringify(newCards));
  
  // 2. Update số lượng từ ở Deck cha (để trang chủ hiển thị đúng)
  const deckKey = `flashcard_decks_${userId}`;
  const decks = JSON.parse(localStorage.getItem(deckKey) || "[]");
  const updatedDecks = decks.map((d: any) => d.id === deckId ? { ...d, wordCount: newCards.length } : d);
  localStorage.setItem(deckKey, JSON.stringify(updatedDecks));
};