// Adapters to convert between frontend format and backend format
import type { BackendFlashcardDeck, BackendFlashcard, BackendProgress } from "@/types/flashcards";

// Frontend types (from app/flashcards/lib/types.ts)
export interface FlashCardItem {
  href: string;
  title: string;
  wordCount: number;
  userCount: number;
  userAvatar: string;
  username: string;
  learned: number;
  remembered: number;
  needReview: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  wordCount: number;
  createdAt: Date;
}


// Adapter functions
export const adaptDeckToFrontend = (backendDeck: BackendFlashcardDeck): FlashcardDeck => {
  return {
    id: backendDeck._id,
    name: backendDeck.name,
    description: backendDeck.description,
    wordCount: backendDeck.wordCount,
    createdAt: new Date(backendDeck.createdAt),
  };
};

export const adaptDecksToFrontend = (backendDecks: BackendFlashcardDeck[]): FlashcardDeck[] => {
  return backendDecks.map(adaptDeckToFrontend);
};

export const adaptCardToWord = (backendCard: BackendFlashcard) => {
  return {
    id: backendCard._id,
    word: backendCard.word,
    type: backendCard.type,
    phonetic: backendCard.phonetic,
    definition: backendCard.definition,
    example: backendCard.example,
    image: backendCard.image || '',
    audio: backendCard.audio || '',
  };
};

export const adaptCardsToWords = (backendCards: BackendFlashcard[]) => {
  return backendCards.map(adaptCardToWord);
};

export const adaptDeckToFlashCardItem = (backendDeck: BackendFlashcardDeck, progress?: BackendProgress): FlashCardItem => {
  const createdBy = typeof backendDeck.createdBy === 'string' 
    ? { name: 'Unknown', email: '' } 
    : backendDeck.createdBy;
  
  return {
    href: `/flashcards/lists/${backendDeck._id}`,
    title: backendDeck.name,
    wordCount: backendDeck.wordCount,
    userCount: backendDeck.userCount || 0,
    userAvatar: '/avatar.png', // Default
    username: createdBy?.name || 'Unknown',
    learned: progress?.learned || 0,
    remembered: progress?.remembered || 0,
    needReview: progress?.review || 0,
    // hasProgress: progress !== undefined, // Track if progress record exists
  };
};

