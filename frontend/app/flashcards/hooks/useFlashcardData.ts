// hooks/useFlashcardData.ts
import { useState, useEffect } from "react";
import { FlashCardItem, Progress } from "../lib/types"; // Adjust path as needed
import { getUserId } from "../utils/helpers"; // Import the helper

// Helper to generate key (keeping it internal or imported)
const getProgressKey = (title: string, userId: string) =>
  `flashcard_progress_${userId}_${title.replace(/\s+/g, "_").toLowerCase()}`;

export function useFlashcardData() {
  const [data, setData] = useState<FlashCardItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [globalProgress, setGlobalProgress] = useState<Progress>({
    total: 0,
    learned: 0,
    remembered: 0,
    review: 0,
  });

  // 1. Get User ID on Mount (Client-side only)
  useEffect(() => {
    const id = getUserId();
    setCurrentUserId(id);
  }, []);

  // 2. Fetch JSON Data
  useEffect(() => {
    fetch("/flashcards.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // 3. Calculate Progress
  useEffect(() => {
    if (!currentUserId || data.length === 0) {
      // If no user or no data, reset progress (or keep total)
      setGlobalProgress({
        total: data.length,
        learned: 0,
        remembered: 0,
        review: 0,
      });
      return;
    }

    let learned = 0,
      remembered = 0,
      review = 0;

    data.forEach((item) => {
      const key = getProgressKey(item.title, currentUserId);
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const stats = parsed?.stats;
          
          if (stats) {
            // Safety checks: ensure we add numbers, treat undefined as 0
            learned += Number(stats.learned) || 0;
            remembered += Number(stats.remembered) || 0;
            review += Number(stats.review) || 0;
          }
        } catch (e) {
          console.error(`Error parsing stats for ${item.title}`, e);
        }
      }
    });

    setGlobalProgress({
      total: data.length,
      learned,
      remembered,
      review,
    });
  }, [data, currentUserId]); // Recalculate when data or user changes

  return { data, globalProgress, currentUserId };
}