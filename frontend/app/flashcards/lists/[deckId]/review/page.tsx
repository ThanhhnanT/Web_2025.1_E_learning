"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spin, Result, Button } from 'antd';
import WordReview from '@/components/WordReview';
import { getUserId, getDeckData } from '../utils';

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

function ReviewPage() {
  const [data, setData] = useState<Word[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;
  const [userId, setUserId] = useState<string | null>(null);

  // Get User ID on mount
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  // Load deck data from API
  useEffect(() => {
    const loadData = async () => {
      if (!userId || !deckId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { title: deckTitle, cards } = await getDeckData(userId, deckId);
        
        setTitle(deckTitle);
        
        // Convert cards to Word format (remove id field if present)
        const convertedData: Word[] = cards.map((card: any) => ({
          word: card.word || "Chưa nhập từ",
          type: card.type || "",
          phonetic: card.phonetic || "",
          definition: card.definition || "Chưa nhập nghĩa",
          example: card.example || "",
          image: card.image || "", 
          audio: card.audio || "",
        }));

        setData(convertedData);
      } catch (error) {
        console.error("Error loading deck data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
  return (
    <div>
      {/* Header với các nút điều hướng */}
      <div className="review-term-wrapper" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button 
            type="link" 
            onClick={() => router.push(`/flashcards/lists/${deckId}`)}
            style={{ padding: 0, height: 'auto' }}
          >
            &lt;&lt; Xem tất cả
          </Button>
          <span style={{ color: '#d9d9d9', margin: '0 4px' }}>•</span>
          <Button 
            type="link" 
            onClick={() => {
              // TODO: Implement review mode settings modal
              console.log('Cài đặt chế độ review');
            }}
            style={{ padding: 0, height: 'auto' }}
          >
            Cài đặt chế độ review
          </Button>
          <span style={{ color: '#d9d9d9', margin: '0 4px' }}>•</span>
          <Button 
            type="link" 
            onClick={() => {
              // TODO: Implement skipped words modal
              console.log('Các từ đã bỏ qua');
            }}
            style={{ padding: 0, height: 'auto' }}
          >
            Các từ đã bỏ qua
          </Button>
        </div>
        <Button 
          danger 
          onClick={() => {
            // This will be handled by WordReview component's stop modal
            const event = new CustomEvent('stopLearning');
            window.dispatchEvent(event);
          }}
          style={{ flexShrink: 0 }}
        >
          Dừng học list từ này
        </Button>
      </div>

      <WordReview data={data} title={title} deckId={deckId} />
    </div>
  );
}

export default ReviewPage;