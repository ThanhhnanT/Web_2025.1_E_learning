"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Spin, Result, Button } from 'antd';
import WordReview from '@/components/WordReview'; // Đảm bảo đường dẫn đúng tới file WordReview của bạn

// Interface cho dữ liệu đầu ra (để truyền vào WordReview)
interface Word {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string; 
}

// Helper lấy UserID
function getUserId(): string | null {
  try {
    const directId = Cookies.get("user_id");
    if (directId) return directId;
    const token = Cookies.get("access_token");
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload).sud; 
  } catch (e) { return null; }
}

function ReviewPage() {
  const [data, setData] = useState<Word[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;
  const userId = getUserId();

  useEffect(() => {
    if (!userId || !deckId) {
      setLoading(false);
      return;
    }

    // 1. Lấy tên Deck từ localStorage
    const savedDecks = localStorage.getItem(`flashcard_decks_${userId}`);
    if (savedDecks) {
      try {
        const decks = JSON.parse(savedDecks);
        const currentDeck = decks.find((d: any) => d.id === deckId);
        if (currentDeck) setTitle(currentDeck.name);
      } catch (e) { console.error(e); }
    }

    // 2. Lấy danh sách Cards từ localStorage
    const savedCardsKey = `flashcard_deck_${userId}_${deckId}`;
    const savedCards = localStorage.getItem(savedCardsKey);

    if (savedCards) {
      try {
        const customFlashcards = JSON.parse(savedCards);
        
        // Map dữ liệu từ Storage (front/back) -> Component (word/definition)
        const convertedData: Word[] = customFlashcards.map((card: any) => ({
          word: card.word || "Chưa nhập từ",
          type: "", // List tự tạo thường không có loại từ
          phonetic: card.phonetic || "",
          definition: card.definition || "Chưa nhập nghĩa",
          example: card.example || "",
          image: card.image || "", 
          audio: card.audio || "",
        }));

        setData(convertedData);
      } catch (e) {
        console.error("Lỗi parse data:", e);
        setData([]);
      }
    } else {
      setData([]);
    }

    setLoading(false);
  }, [userId, deckId]);

  // --- XỬ LÝ TRẠNG THÁI ---

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Result
          status="warning"
          title="Danh sách trống"
          subTitle="Bạn chưa thêm từ vựng nào vào danh sách này để ôn tập."
          extra={
            <Button type="primary" onClick={() => router.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // --- TRẢ VỀ ĐÚNG YÊU CẦU ---
  return <WordReview data={data} title={title} />;
}

export default ReviewPage;