// hooks/useFlashcardData.ts
import { useState, useEffect } from "react";
import { FlashCardItem, Progress } from "../lib/types";
import { getUserId } from "@/lib/helper";
import { getSampleDecks, getAllProgress } from "@/service/flashcards";
import { adaptDeckToFlashCardItem } from "@/lib/flashcardAdapters";
import type { BackendFlashcardDeck, BackendProgress } from "@/types/flashcards";

export function useFlashcardData() {
  const [data, setData] = useState<FlashCardItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [globalProgress, setGlobalProgress] = useState<Progress>({
    total: 0,
    learned: 0,
    remembered: 0,
    review: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Get User ID on Mount (Client-side only)
  useEffect(() => {
    const id = getUserId();
    setCurrentUserId(id);
  }, []);

  // 2. Fetch Data from API (with fallback to static JSON)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to fetch from API first
        const decksResponse = await getSampleDecks();
        let progressResponse: any = [];
        if (currentUserId) {
          try {
            progressResponse = await getAllProgress(currentUserId);
          } catch (error: any) {
            console.error("useFlashcardData - Error calling getAllProgress:", error);
            progressResponse = [];
          }
        }
        
        // Ensure responses are arrays
        const decks: BackendFlashcardDeck[] = Array.isArray(decksResponse) ? decksResponse : [];
        const progressList: BackendProgress[] = Array.isArray(progressResponse) ? progressResponse : [];
        
        // Create a map of progress by deckId
        const progressMap = new Map<string, BackendProgress>();
        progressList.forEach(p => {
          const deckId = typeof p.deckId === 'string' ? p.deckId : p.deckId._id;
          progressMap.set(deckId, p);
        });

        // Convert to frontend format
        const items: FlashCardItem[] = decks.map(deck => {
          const deckId = deck._id;
          const progress = progressMap.get(deckId);
          return adaptDeckToFlashCardItem(deck, progress);
        });

        setData(items);
      } catch (error: any) {
        console.error("API fetch error:", error);
        // Log more details for debugging
        if (error?.response) {
          console.error("API Error Details:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            message: error.message
          });
          console.error("Full error response:", JSON.stringify(error.response.data, null, 2));
        } else if (error?.request) {
          console.error("Network Error - No response received:", {
            message: error.message,
            request: error.request
          });
        } else {
          console.error("Error setting up request:", error.message);
        }
        // No fallback - just set empty array
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId, refreshTrigger]);

  // Refresh data when window gains focus or when progress is updated
  useEffect(() => {
    const handleFocus = () => {
      // Check if progress was updated while away
      const progressUpdated = sessionStorage.getItem('flashcard_progress_updated');
      if (progressUpdated) {
        sessionStorage.removeItem('flashcard_progress_updated');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if progress was updated while away
        const progressUpdated = sessionStorage.getItem('flashcard_progress_updated');
        if (progressUpdated) {
          sessionStorage.removeItem('flashcard_progress_updated');
          setRefreshTrigger(prev => prev + 1);
        }
      }
    };

    // Check on mount if progress was updated
    const progressUpdated = sessionStorage.getItem('flashcard_progress_updated');
    if (progressUpdated) {
      sessionStorage.removeItem('flashcard_progress_updated');
      setRefreshTrigger(prev => prev + 1);
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 3. Calculate Progress
  useEffect(() => {
    if (!currentUserId || data.length === 0) {
      setGlobalProgress({
        total: data.length,
        learned: 0,
        remembered: 0,
        review: 0,
      });
      return;
    }

    const calculateProgress = async () => {
      try {
        const progressResponse = await getAllProgress(currentUserId);
        // Ensure response is an array
        const progressList: BackendProgress[] = Array.isArray(progressResponse) ? progressResponse : [];
        
        let learned = 0,
          remembered = 0,
          review = 0;

        progressList.forEach(p => {
          learned += p.learned || 0;
          remembered += p.remembered || 0;
          review += p.review || 0;
        });

        setGlobalProgress({
          total: data.length,
          learned,
          remembered,
          review,
        });
      } catch (error: any) {
        console.error("Error fetching progress:", error);
        if (error?.response) {
          console.error("Progress API Error Details:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        }
        // No fallback - set zero progress on error
        setGlobalProgress({ 
          total: data.length, 
          learned: 0, 
          remembered: 0, 
          review: 0 
        });
      }
    };

    calculateProgress();
  }, [data, currentUserId]);

  return { data, globalProgress, currentUserId, loading };
}
