// src/app/flashcards/lists/[deckId]/utils.ts
import { getUserId } from "@/lib/helper";
import { getDeck, getCardsByDeck, createCardsBatch, updateCard, deleteCard } from "@/service/flashcards";
import { adaptCardsToWords } from "@/lib/flashcardAdapters";

// Re-export getUserId for convenience
export { getUserId };

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

export const getDeckData = async (userId: string, deckId: string) => {
  try {
    // Try to fetch from API
    const deck = await getDeck(deckId);
    const cards = await getCardsByDeck(deckId);
    
    return {
      title: deck.name,
      cards: adaptCardsToWords(cards),
    };
  } catch (error) {
    console.error("Error fetching deck data from API:", error);
    // No fallback - re-throw error
    throw error;
  }
};

export const saveDeckData = async (userId: string, deckId: string, newCards: Word[]) => {
  try {
    // Try to save to API
    // First, get existing cards to determine which to update/delete/create
    const existingCards = await getCardsByDeck(deckId);
    const existingIds = new Set(existingCards.map((c: any) => c._id));
    const newIds = new Set(newCards.filter(c => c.id).map(c => c.id));

    // Cards to create (no id)
    const toCreate = newCards.filter(c => !c.id);
    if (toCreate.length > 0) {
      await createCardsBatch(deckId, toCreate.map(card => ({
        word: card.word,
        type: card.type,
        phonetic: card.phonetic,
        definition: card.definition,
        example: card.example,
        image: card.image,
        audio: card.audio,
        userId,
      })));
    }

    // Cards to update (has id and exists)
    const toUpdate = newCards.filter(c => c.id && existingIds.has(c.id));
    for (const card of toUpdate) {
      if (card.id) {
        await updateCard(deckId, card.id, {
          word: card.word,
          type: card.type,
          phonetic: card.phonetic,
          definition: card.definition,
          example: card.example,
          image: card.image,
          audio: card.audio,
        });
      }
    }

    // Cards to delete (exists but not in newCards)
    const toDelete = existingCards.filter((c: any) => !newIds.has(c._id));
    for (const card of toDelete) {
      await deleteCard(deckId, card._id);
    }
  } catch (error) {
    console.error("Error saving deck data to API:", error);
    // No fallback - re-throw error
    throw error;
  }
};
