// Types for flashcards feature

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

export interface Progress {
  total: number;
  learned: number;
  remembered: number;
  review: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  wordCount: number;
  createdAt: Date;
}

export interface Word {
  id?: string;
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string;
}

// Backend response types
export interface BackendFlashcardDeck {
  _id: string;
  name: string;
  description?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  } | string;
  wordCount: number;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BackendFlashcard {
  _id: string;
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image?: string;
  audio?: string;
  deckId: {
    _id: string;
    name: string;
  } | string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  courseId?: string | null;
  lessonId?: string | null;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  reviewCount: number;
  lastReviewed?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BackendProgress {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  deckId: {
    _id: string;
    name: string;
  } | string;
  learned: number;
  remembered: number;
  review: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface DeckSummaryResponse {
  deck: BackendFlashcardDeck;
  stats: {
    wordCount: number;
    userCount: number;
    learned: number;
    remembered: number;
    review: number;
  };
  cards: BackendFlashcard[];
  progress: BackendProgress | null;
}

