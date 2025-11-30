"use client";

import React, { useEffect, useState } from "react";
import { Empty, Spin } from "antd";
import FlashCard from "@/components/FlashCard";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/ModalAuth";
import { checkAuth } from "@/lib/helper";
import { HeaderSection } from "../components/FlashCardHeaderSection";
import { getSampleDecks } from "@/service/flashcards";
import { adaptDeckToFlashCardItem } from "@/lib/flashcardAdapters";
import type { BackendFlashcardDeck } from "@/types/flashcards";
import { FlashCardItem } from "../lib/types";

function FlashcardPage() {
  const [data, setData] = useState<FlashCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getSampleDecks();
        // Ensure response is an array
        const decks: BackendFlashcardDeck[] = Array.isArray(response) ? response : [];
        const items: FlashCardItem[] = decks.map(deck => adaptDeckToFlashCardItem(deck));
        setData(items);
      } catch (error: any) {
        console.error("Error fetching sample decks:", error);
        if (error?.response) {
          console.error("Sample Decks API Error:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url
          });
        } else if (error?.request) {
          console.error("Network Error - No response received:", error.message);
        } else {
          console.error("Error setting up request:", error.message);
        }
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFlashcardClick = (href: string,title:string) => {
    if (checkAuth()) {
      // Pass title as URL param instead of localStorage
      const urlWithTitle = href.includes('?') 
        ? `${href}&title=${encodeURIComponent(title)}`
        : `${href}?title=${encodeURIComponent(title)}`;
      router.push(urlWithTitle);
    } else {
      // Store redirect in window object instead of localStorage
      (window as any).__pendingRedirect = "/flashcards";
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <HeaderSection />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty description="Không có bộ từ vựng nào" className="mt-20" />
      ) : (
        <div
          style={{
            marginTop: 30,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Responsive Grid
            gap: 20,
          }}
        >
          {data.map((item, index) => (
            <div key={index} onClick={() => handleFlashcardClick(item.href,item.title)} style={{ cursor: "pointer" }}>
              <FlashCard {...item} />
            </div>
          ))}
        </div>
      )}

      <AuthModal
        visible={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        setOpen={(open: boolean) => {
          setAuthModalOpen(open);
          if (!open && checkAuth()) {
              const redirect = (window as any).__pendingRedirect;
              if (redirect) {
                delete (window as any).__pendingRedirect;
                router.push(redirect);                    
              }
          }
        }}
      />
    </>
  );
}

export default FlashcardPage;
