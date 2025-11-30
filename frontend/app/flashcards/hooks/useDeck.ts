import { useState, useEffect } from "react";
import { FlashcardDeck } from "../lib/types";
import { getUserId } from "@/lib/helper";
import { getDecks, createDeck, updateDeck, deleteDeck } from "@/service/flashcards";
import { adaptDecksToFrontend } from "@/lib/flashcardAdapters";
import type { BackendFlashcardDeck } from "@/types/flashcards";

export function useDecks(currentUserId: string | null) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load from API
  useEffect(() => {
    const loadDecks = async () => {
      setIsInitialized(false);
      if (!currentUserId) {
        setIsInitialized(true);
        return;
      }

      try {
        setLoading(true);
        const response = await getDecks(currentUserId);
        // Ensure response is an array
        const backendDecks: BackendFlashcardDeck[] = Array.isArray(response) ? response : [];
        const frontendDecks = adaptDecksToFrontend(backendDecks);
        setDecks(frontendDecks);
      } catch (error: any) {
        console.error("Error loading decks from API:", error);
        if (error?.response) {
          console.error("Decks API Error Details:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url
          });
        }
        // No fallback - set empty array on error
        setDecks([]);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    loadDecks();
  }, [currentUserId]);

  const addDeck = async (name: string, description: string) => {
    if (!currentUserId) {
      throw new Error("User not logged in");
    }

    try {
      const newDeck = await createDeck({
        name,
        description,
        createdBy: currentUserId,
      });
      const frontendDeck = adaptDecksToFrontend([newDeck])[0];
      setDecks((prev) => [...prev, frontendDeck]);
      return frontendDeck;
    } catch (error) {
      console.error("Error creating deck:", error);
      throw error; // Re-throw error instead of fallback
    }
  };

  const updateDeckHandler = async (id: string, name: string, description: string) => {
    try {
      await updateDeck(id, { name, description });
      setDecks((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name, description } : d))
      );
    } catch (error) {
      console.error("Error updating deck:", error);
      throw error; // Re-throw error instead of fallback
    }
  };

  const deleteDeckHandler = async (id: string) => {
    if (!currentUserId) return;

    try {
      await deleteDeck(id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error deleting deck:", error);
      throw error; // Re-throw error instead of fallback
    }
  };

  return { 
    decks, 
    addDeck, 
    updateDeck: updateDeckHandler, 
    deleteDeck: deleteDeckHandler,
    loading,
    isInitialized
  };
}
