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