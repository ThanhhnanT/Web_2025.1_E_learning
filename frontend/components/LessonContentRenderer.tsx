"use client";

import React, { useState } from 'react';
import { Card, Radio, Button, Space, Typography, Divider, message, Result } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { Lesson } from '@/types/course';
import VideoPlayer from './VideoPlayer';
import styles from '@/styles/lessonContent.module.css';

const { Title, Text, Paragraph } = Typography;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

interface QuizContent {
  questions: QuizQuestion[];
  passingScore?: number;
}

interface LessonContentRendererProps {
  lesson: Lesson;
  onVideoUrlChange?: (url: string | null) => void;
}

export default function LessonContentRenderer({ lesson, onVideoUrlChange }: LessonContentRendererProps) {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Get video URL for video lessons
  const getVideoUrl = (): string | null => {
    if (lesson.type !== 'video' || !lesson.content) return null;

    if (typeof lesson.content === 'string') {
      return lesson.content;
    }

    if (typeof lesson.content === 'object' && lesson.content !== null) {
      return lesson.content.video_url || null;
    }

    return null;
  };

  // Get text content for text lessons
  const getTextContent = (): string | null => {
    if (lesson.type !== 'text' || !lesson.content) return null;

    if (typeof lesson.content === 'object' && lesson.content !== null) {
      return lesson.content.text_content || null;
    }

    return null;
  };

  // Get quiz content for quiz lessons
  const getQuizContent = (): QuizContent | null => {
    if (lesson.type !== 'quiz' || !lesson.content) return null;

    if (typeof lesson.content === 'object' && lesson.content !== null) {
      return lesson.content as QuizContent;
    }

    return null;
  };

  const isDirectVideoFile = (url: string): boolean => {
    const videoFileExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m3u8)$/i;
    const cloudStoragePatterns = [
      /cloudinary\.com/i,
      /amazonaws\.com/i,
      /s3\./i,
      /storage\.googleapis\.com/i,
      /blob\.core\.windows\.net/i,
      /\.mp4\?/i,
      /\.webm\?/i,
    ];
    return videoFileExtensions.test(url) || cloudStoragePatterns.some(pattern => pattern.test(url));
  };

  const convertToEmbedUrl = (url: string): string => {
    if (url.includes('embed')) return url;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const handleQuizAnswerChange = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleQuizSubmit = () => {
    const quizContent = getQuizContent();
    if (!quizContent) return;

    let totalScore = 0;
    let totalPoints = 0;

    quizContent.questions.forEach((q, index) => {
      totalPoints += q.points;
      if (quizAnswers[index] === q.correctAnswer) {
        totalScore += q.points;
      }
    });

    setQuizScore(totalScore);
    setQuizSubmitted(true);

    const percentage = (totalScore / totalPoints) * 100;
    const passingScore = quizContent.passingScore || totalPoints * 0.6;

    if (totalScore >= passingScore) {
      message.success(`Chúc mừng! Bạn đã đạt ${totalScore}/${totalPoints} điểm (${percentage.toFixed(1)}%)`);
    } else {
      message.warning(`Bạn đạt ${totalScore}/${totalPoints} điểm (${percentage.toFixed(1)}%). Cần ${passingScore} điểm để đạt.`);
    }
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Render based on lesson type
  if (lesson.type === 'video') {
    const videoUrl = getVideoUrl();
    if (!videoUrl) {
      return (
        <div className={styles.lessonPlaceholder}>
          <Text type="secondary">Video không khả dụng</Text>
        </div>
      );
    }

    return (
      <div className={styles.videoContainer}>
        {isDirectVideoFile(videoUrl) ? (
          <VideoPlayer src={videoUrl} title={lesson.title} className={styles.videoPlayer} />
        ) : (
          <iframe
            src={convertToEmbedUrl(videoUrl)}
            title={lesson.title}
            className={styles.videoPlayer}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  if (lesson.type === 'text') {
    const textContent = getTextContent();
    if (!textContent) {
      return (
        <div className={styles.lessonPlaceholder}>
          <Text type="secondary">Nội dung không khả dụng</Text>
        </div>
      );
    }

    return (
      <div className={styles.textContent}>
        <div
          className={styles.htmlContent}
          dangerouslySetInnerHTML={{ __html: textContent }}
        />
      </div>
    );
  }

  if (lesson.type === 'quiz') {
    const quizContent = getQuizContent();
    if (!quizContent || !quizContent.questions || quizContent.questions.length === 0) {
      return (
        <div className={styles.lessonPlaceholder}>
          <Text type="secondary">Quiz không khả dụng</Text>
        </div>
      );
    }

    const totalPoints = quizContent.questions.reduce((sum, q) => sum + q.points, 0);
    const passingScore = quizContent.passingScore || totalPoints * 0.6;

    return (
      <div className={styles.quizContainer}>
        <Card>
          <Title level={4}>Bài kiểm tra</Title>
          <Text type="secondary">
            Tổng điểm: {totalPoints} điểm • Điểm đạt: {passingScore} điểm
          </Text>

          <Divider />

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {quizContent.questions.map((question, questionIndex) => {
              const userAnswer = quizAnswers[questionIndex];
              const isCorrect = quizSubmitted && userAnswer === question.correctAnswer;
              const isIncorrect = quizSubmitted && userAnswer !== undefined && userAnswer !== question.correctAnswer;

              return (
                <Card
                  key={questionIndex}
                  className={`${styles.quizQuestionCard} ${isCorrect ? styles.correctAnswer : ''} ${isIncorrect ? styles.incorrectAnswer : ''}`}
                >
                  <div className={styles.questionHeader}>
                    <Text strong>
                      Câu {questionIndex + 1} ({question.points} điểm)
                    </Text>
                    {quizSubmitted && (
                      <span className={styles.answerIndicator}>
                        {isCorrect ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        ) : isIncorrect ? (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                        ) : null}
                      </span>
                    )}
                  </div>

                  <Paragraph className={styles.questionText}>{question.question}</Paragraph>

                  <Radio.Group
                    value={userAnswer}
                    onChange={(e) => handleQuizAnswerChange(questionIndex, e.target.value)}
                    disabled={quizSubmitted}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {question.options.map((option, optionIndex) => (
                        <Radio key={optionIndex} value={optionIndex} className={styles.quizOption}>
                          {option}
                          {quizSubmitted && optionIndex === question.correctAnswer && (
                            <Text type="success" style={{ marginLeft: 8 }}>
                              (Đáp án đúng)
                            </Text>
                          )}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>
              );
            })}
          </Space>

          <Divider />

          <div className={styles.quizActions}>
            {!quizSubmitted ? (
              <Button
                type="primary"
                size="large"
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < quizContent.questions.length}
              >
                Nộp bài
              </Button>
            ) : (
              <div className={styles.quizResult}>
                <Result
                  status={quizScore !== null && quizScore >= passingScore ? 'success' : 'error'}
                  title={
                    quizScore !== null && quizScore >= passingScore
                      ? `Chúc mừng! Bạn đã đạt ${quizScore}/${totalPoints} điểm`
                      : `Bạn đạt ${quizScore}/${totalPoints} điểm`
                  }
                  subTitle={
                    quizScore !== null && quizScore >= passingScore
                      ? `Tỷ lệ đúng: ${((quizScore / totalPoints) * 100).toFixed(1)}%`
                      : `Cần ${passingScore} điểm để đạt. Tỷ lệ đúng: ${((quizScore! / totalPoints) * 100).toFixed(1)}%`
                  }
                  extra={
                    <Button type="primary" onClick={handleQuizReset}>
                      Làm lại
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.lessonPlaceholder}>
      <Text type="secondary">Loại bài học không được hỗ trợ</Text>
    </div>
  );
}

