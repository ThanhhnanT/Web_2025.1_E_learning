import { getUserId } from "@/lib/helper";

// Re-export getUserId for backward compatibility
export { getUserId };

export const getDeckStorageKey = (userId: string) => `flashcard_decks_${userId}`;

export const getProgressKey = (title: string, userId: string) =>
  `flashcard_progress_${userId}_${title.replace(/\s+/g, "_").toLowerCase()}`;