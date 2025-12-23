"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Statistic, Row, Col, Progress, Tabs, Button, Select, Empty } from 'antd';
import type { TabsProps } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import styles from '@/styles/reviewPanel.module.css';
import { TestResult, Question, TestSection } from '@/types/test';
import QuestionRenderer from './QuestionRenderer';
import { THEME_COLORS } from '@/constants/colors';

interface ReviewPanelProps {
  result: TestResult;
  test: {
    title: string;
    sections: TestSection[];
  };
  selectedSectionIds?: string[];
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ result, test, selectedSectionIds }) => {
  const router = useRouter();
  const params = useParams<{ testId: string; resultId: string }>();
  const { testId, resultId } = params;
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Calculate statistics
  const accuracyPercent =
    result.totalQuestions > 0
      ? (result.correctAnswers / result.totalQuestions) * 100
      : 0;
  const totalSeconds = result.timeSpent || 0;
  const avgTimePerQuestion =
    result.totalQuestions > 0 ? totalSeconds / result.totalQuestions : 0;
  const bandScore = result.bandScore ?? 0;

  // Overall distribution
  const totalQuestions = result.totalQuestions || 0;
  const correctCount = result.correctAnswers || 0;
  const answeredCount = result.answers?.length || 0;
  const wrongCount = Math.max(answeredCount - correctCount, 0);
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  const correctOverallPercent =
    totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const wrongOverallPercent =
    totalQuestions > 0 ? (wrongCount / totalQuestions) * 100 : 0;
  const unansweredOverallPercent =
    totalQuestions > 0 ? (unansweredCount / totalQuestions) * 100 : 0;

  const formatDuration = (secondsTotal: number) => {
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = Math.floor(secondsTotal % 60);
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Get all questions from test, filter by selectedSectionIds if provided
  const allQuestions: Question[] = [];
  const sectionsToUse = selectedSectionIds && selectedSectionIds.length > 0
    ? test.sections.filter(section => selectedSectionIds.includes(section._id.toString()))
    : test.sections;
  
  sectionsToUse.forEach(section => {
    section.questionGroups?.forEach(group => {
      group.questions?.forEach(question => {
        allQuestions.push(question);
      });
    });
  });

  // Filter questions based on result
  const getFilteredQuestions = () => {
    let filtered = allQuestions;

    // Filter by section
    if (selectedSection !== 'all') {
      const section = test.sections.find(s => s._id === selectedSection);
      if (section) {
        const [start, end] = section.questionRange;
        filtered = filtered.filter(q => q.questionNumber >= start && q.questionNumber <= end);
      }
    }

    // Filter by correctness
    if (filterType === 'correct') {
      filtered = filtered.filter(q => {
        const answer = result.answers.find(a => a.questionNumber === q.questionNumber);
        return answer?.isCorrect;
      });
    } else if (filterType === 'incorrect') {
      filtered = filtered.filter(q => {
        const answer = result.answers.find(a => a.questionNumber === q.questionNumber);
        return answer && !answer.isCorrect;
      });
    }

    return filtered;
  };

  const renderStatistics = () => {
    return (
      <Card className={styles.statsCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="IELTS Band"
              value={bandScore}
              precision={1}
              prefix={<TrophyOutlined />}
              suffix="/ 9.0"
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Accuracy"
              value={accuracyPercent.toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: accuracyPercent >= 70 ? THEME_COLORS.success : THEME_COLORS.error }}
            />
            <Progress 
              percent={accuracyPercent} 
              showInfo={false}
              strokeColor={accuracyPercent >= 70 ? THEME_COLORS.success : THEME_COLORS.error}
              size="small"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Correct Answers"
              value={result.correctAnswers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: THEME_COLORS.success }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Time Spent"
              value={formatDuration(totalSeconds)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className={styles.avgTime}>
              Avg: {avgTimePerQuestion.toFixed(1)}s/question
            </div>
          </Col>
        </Row>

        <div className={styles.distributionWrapper}>
          <div className={styles.distributionChart}>
            <div
              className={styles.distributionCircle}
              style={{
                background: `conic-gradient(
                  ${THEME_COLORS.success} 0 ${correctOverallPercent}%,
                  ${THEME_COLORS.error} ${correctOverallPercent}% ${
                    correctOverallPercent + wrongOverallPercent
                  }%,
                  #d9d9d9 ${
                    correctOverallPercent + wrongOverallPercent
                  }% 100%
                )`,
              }}
            >
              <div className={styles.distributionCircleInner}>
                <span className={styles.distributionCircleLabel}>
                  {Math.round(correctOverallPercent)}%
                </span>
              </div>
            </div>
          </div>
          <div className={styles.distributionLegend}>
            <div className={styles.legendRow}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: THEME_COLORS.success }}
              />
              <span>Đúng: {correctCount} câu</span>
            </div>
            <div className={styles.legendRow}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: '#ff4d4f' }}
              />
              <span>Sai: {wrongCount} câu</span>
            </div>
            <div className={styles.legendRow}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: '#d9d9d9' }}
              />
              <span>Chưa làm: {unansweredCount} câu</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderFilters = () => {
    return (
      <Card className={styles.filtersCard} size="small">
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          </Col>
          <Col>
            <span className={styles.filterLabel}>Filter:</span>
          </Col>
          <Col>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 140 }}
            >
              <Select.Option value="all">All Questions</Select.Option>
              <Select.Option value="correct">Correct Only</Select.Option>
              <Select.Option value="incorrect">Incorrect Only</Select.Option>
            </Select>
          </Col>
          <Col>
            <span className={styles.filterLabel}>Section:</span>
          </Col>
          <Col flex="auto">
            <Select
              value={selectedSection}
              onChange={setSelectedSection}
              style={{ width: 200 }}
            >
              <Select.Option value="all">All Sections</Select.Option>
              {(selectedSectionIds && selectedSectionIds.length > 0
                ? test.sections.filter(section => 
                    selectedSectionIds.includes(section._id.toString())
                  )
                : test.sections
              ).map(section => (
                <Select.Option key={section._id} value={section._id}>
                  {section.title}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderQuestionReview = () => {
    const filteredQuestions = getFilteredQuestions();

    if (filteredQuestions.length === 0) {
      return (
        <Empty 
          description="No questions match your filter criteria"
          style={{ padding: '40px 0' }}
        />
      );
    }

    // Group questions by section
    const questionsBySection = new Map<string, { section: TestSection; questions: Question[] }>();
    
    const sectionsToUse = selectedSectionIds && selectedSectionIds.length > 0
      ? test.sections.filter(section => selectedSectionIds.includes(section._id.toString()))
      : test.sections;

    sectionsToUse.forEach(section => {
      const [start, end] = section.questionRange;
      const sectionQuestions = filteredQuestions.filter(
        q => q.questionNumber >= start && q.questionNumber <= end
      );
      if (sectionQuestions.length > 0) {
        questionsBySection.set(section._id.toString(), {
          section,
          questions: sectionQuestions,
        });
      }
    });

    return (
      <div>
        {Array.from(questionsBySection.values()).map(({ section, questions }) => {
          // Group questions in pairs for 2 columns layout
          const questionPairs: Question[][] = [];
          for (let i = 0; i < questions.length; i += 2) {
            questionPairs.push(questions.slice(i, i + 2));
          }

          return (
            <Card 
              key={section._id} 
              className={styles.answersCard}
              title={section.title}
              extra={
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    if (testId && resultId) {
                      router.push(`/tests/${testId}/results/${resultId}/answers/${section._id}`);
                    }
                  }}
                >
                  Xem Transcript & Answer Keys
                </Button>
              }
            >
              <div className={styles.questionsContainer}>
                {questionPairs.map((pair, pairIndex) => (
                  <div key={pairIndex} className={styles.answerRow}>
                    {pair.map(question => {
                      const answer = result.answers.find(a => a.questionNumber === question.questionNumber);
                      const userAnswer = answer?.userAnswer || [];
                      const isCorrect = answer?.isCorrect || false;
                      const correctAnswer = question.correctAnswer?.value?.join(', ') || '';
                      const userAnswerText = userAnswer.join(', ') || '';

                      return (
                        <div key={question._id} className={styles.answerItem}>
                          {isCorrect ? (
                            <span className={styles.correctAnswer}>
                              {question.questionNumber}. {userAnswerText} <span className={styles.checkMark}>✓</span>
                            </span>
                          ) : userAnswerText ? (
                            <span className={styles.incorrectAnswer}>
                              {question.questionNumber}. <span className={styles.strikethrough}>{userAnswerText}</span> <span className={styles.crossMark}>✗</span> → <span className={styles.correctText}>{correctAnswer}</span>
                            </span>
                          ) : (
                            <span className={styles.unansweredAnswer}>
                              {question.questionNumber}. <span className={styles.unansweredText}>chưa trả lời</span> → <span className={styles.correctText}>{correctAnswer}</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {pair.length === 1 && <div className={styles.answerItem} />}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSectionBreakdown = () => {
    // Nếu có selectedSectionIds, chỉ hiển thị các sections đã chọn khi bắt đầu bài kiểm tra
    // Nếu không có (backward compatibility), hiển thị tất cả sections
    const sectionsToDisplay = selectedSectionIds && selectedSectionIds.length > 0
      ? test.sections.filter(section => 
          selectedSectionIds.includes(section._id.toString())
        )
      : test.sections;

    if (sectionsToDisplay.length === 0) {
      return null;
    }

    return (
      <Card className={styles.breakdownCard}>
        <h3 className={styles.breakdownTitle}>Performance by Section</h3>
        {sectionsToDisplay.map(section => {
          const [start, end] = section.questionRange;
          const sectionAnswers = result.answers.filter(
            a => a.questionNumber >= start && a.questionNumber <= end
          );
          const correctInSection = sectionAnswers.filter(a => a.isCorrect).length;
          const totalQuestionsInSection = end - start + 1;
          const wrongInSection = Math.max(
            sectionAnswers.length - correctInSection,
            0,
          );
          const unansweredInSection = Math.max(
            totalQuestionsInSection - sectionAnswers.length,
            0,
          );
          const sectionPercent =
            totalQuestionsInSection > 0
              ? (correctInSection / totalQuestionsInSection) * 100
              : 0;

          // Màu theo trạng thái: đúng hết (xanh), có sai (đỏ), chưa đúng câu nào (xám)
          const sectionColor =
            correctInSection === 0
              ? '#d9d9d9'
              : correctInSection === totalQuestionsInSection
              ? THEME_COLORS.success
              : THEME_COLORS.error;

          return (
            <div key={section._id} className={styles.sectionItem}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>{section.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.sectionScore}>
                    {correctInSection} / {totalQuestionsInSection}
                  </span>
                  {testId && resultId && (
                    <Button
                      type="link"
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        router.push(`/tests/${testId}/results/${resultId}/answers/${section._id}`);
                      }}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      Transcript
                    </Button>
                  )}
                </div>
              </div>
              <div className={styles.sectionBar}>
                <div
                  className={styles.sectionBarSegmentCorrect}
                  style={{
                    width: `${
                      totalQuestionsInSection > 0
                        ? (correctInSection / totalQuestionsInSection) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className={styles.sectionBarSegmentWrong}
                  style={{
                    width: `${
                      totalQuestionsInSection > 0
                        ? (wrongInSection / totalQuestionsInSection) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className={styles.sectionBarSegmentUnanswered}
                  style={{
                    width: `${
                      totalQuestionsInSection > 0
                        ? (unansweredInSection / totalQuestionsInSection) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className={styles.sectionBarLegend}>
                <span className={styles.sectionLegendCorrect}>Đúng</span>
                <span className={styles.sectionLegendWrong}>Sai</span>
                <span className={styles.sectionLegendUnanswered}>Chưa làm</span>
              </div>
            </div>
          );
        })}
      </Card>
    );
  };

  return (
    <div className={styles.reviewContainer}>
      <div className={styles.header}>
        <h2 className={styles.testTitle}>{test.title} - Review</h2>
        <p className={styles.completedAt}>
          Completed: {new Date(result.completedAt).toLocaleString()}
        </p>
      </div>

      {renderStatistics()}
      {renderSectionBreakdown()}

      <Tabs 
        defaultActiveKey="review" 
        className={styles.tabs}
        items={[
          {
            key: 'review',
            label: 'Question Review',
            children: renderQuestionReview(),
          },
          {
            key: 'analysis',
            label: 'Performance Analysis',
            children: (
              <Card>
                <p>Detailed performance analysis coming soon...</p>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ReviewPanel;

