import { getAccess, postAccess, patchAccess, deleteData } from "@/helper/api";

// Deck APIs
export const getDecks = async (userId?: string) => {
  const params = userId ? { userId } : {};
  return await getAccess('flashcards/decks', params);
};

export const createDeck = async (data: { name: string; description?: string; createdBy: string }) => {
  return await postAccess('flashcards/decks', data);
};

export const getDeck = async (id: string) => {
  return await getAccess(`flashcards/decks/${id}`);
};

export const updateDeck = async (id: string, data: { name?: string; description?: string }) => {
  return await patchAccess(`flashcards/decks/${id}`, data);
};

export const deleteDeck = async (id: string) => {
  return await deleteData(`flashcards/decks/${id}`);
};

// Card APIs
export const getCardsByDeck = async (deckId: string) => {
  return await getAccess(`flashcards/decks/${deckId}/cards`);
};

export const createCard = async (deckId: string, data: {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image?: string;
  audio?: string;
  userId: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}) => {
  return await postAccess(`flashcards/decks/${deckId}/cards`, data);
};

export const createCardsBatch = async (deckId: string, cards: Array<{
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image?: string;
  audio?: string;
  userId: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}>) => {
  return await postAccess(`flashcards/decks/${deckId}/cards/batch`, cards);
};

export const updateCard = async (deckId: string, cardId: string, data: {
  word?: string;
  type?: string;
  phonetic?: string;
  definition?: string;
  example?: string;
  image?: string;
  audio?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}) => {
  return await patchAccess(`flashcards/decks/${deckId}/cards/${cardId}`, data);
};

export const deleteCard = async (deckId: string, cardId: string) => {
  return await deleteData(`flashcards/decks/${deckId}/cards/${cardId}`);
};

// Progress APIs
export const getProgress = async (deckId: string, userId?: string) => {
  const params = userId ? { userId } : {};
  return await getAccess(`flashcard-progress/${deckId}`, params);
};

export const updateProgress = async (deckId: string, data: {
  learned?: number;
  remembered?: number;
  review?: number;
  wordStatus?: { [word: string]: string };
}, userId?: string) => {
  // Note: patchAccess doesn't support params, so we'll need to modify the API or use query string
  const url = userId ? `flashcard-progress/${deckId}?userId=${userId}` : `flashcard-progress/${deckId}`;
  return await patchAccess(url, data);
};

export const getAllProgress = async (userId?: string) => {
  // Backend will extract userId from JWT token if not provided in query
  // So we can call without params, or pass userId for explicit filtering
  const params = userId ? { userId } : {};
  try {
    const result = await getAccess('flashcard-progress', params);
    
    // Ensure we always return an array
    if (result === null || result === undefined || result === '') {
      return [];
    }
    
    if (Array.isArray(result)) {
      return result;
    }
    
    return [];
  } catch (error: any) {
    console.error("getAllProgress - error:", error);
    // Return empty array on error instead of throwing
    return [];
  }
};

// Sample data APIs
export const getSampleDecks = async () => {
  return await getAccess('flashcards/samples');
};

export const importSamples = async () => {
  return await postAccess('flashcards/samples/import', {});
};

