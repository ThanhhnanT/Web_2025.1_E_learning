"use client";

import React from 'react';
import { Card, Row, Col, Statistic, List, Progress, Tag } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface FlashcardStatsProps {
  flashcardStats: {
    totalDecks: number;
    totalWordsLearned: number;
    totalWordsRemembered: number;
    totalWordsToReview: number;
    decks: any[];
  };
}

export default function FlashcardStatistics({ flashcardStats }: FlashcardStatsProps) {
  const router = useRouter();

  return (
    <Card title="Thống kê Flashcard" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Tổng số deck"
            value={flashcardStats.totalDecks}
            prefix={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Từ đã học"
            value={flashcardStats.totalWordsLearned}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Từ đã nhớ"
            value={flashcardStats.totalWordsRemembered}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Từ cần ôn lại"
            value={flashcardStats.totalWordsToReview}
            prefix={<ReloadOutlined />}
          />
        </Col>
      </Row>

      {flashcardStats.decks.length > 0 ? (
        <List
          dataSource={flashcardStats.decks}
          renderItem={(item: any) => {
            const deck = item.deckId || {};
            const totalWords = deck.wordCount || 0;
            const learned = item.learned || 0;
            const remembered = item.remembered || 0;
            const review = item.review || 0;
            const totalProgress = learned + remembered + review;
            const progressPercent = totalWords > 0 ? (totalProgress / totalWords) * 100 : 0;

            return (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/flashcards/lists/${deck._id || item.deckId}`)}
              >
                <List.Item.Meta
                  title={deck.name || 'Deck không tên'}
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Progress
                          percent={Math.round(progressPercent)}
                          status="active"
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                      <div>
                        <Tag color="blue">Đã học: {learned}</Tag>
                        <Tag color="green">Đã nhớ: {remembered}</Tag>
                        <Tag color="orange">Cần ôn: {review}</Tag>
                        {totalWords > 0 && (
                          <Tag color="default">Tổng: {totalWords} từ</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          Chưa có deck flashcard nào đang học
        </div>
      )}
    </Card>
  );
}

