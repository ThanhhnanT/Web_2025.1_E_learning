"use client";

import React from 'react';
import { Button, Progress } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import styles from '@/styles/testNavigation.module.css';
import { TestSection, UserAnswer } from '@/types/test';

interface TestNavigationProps {
  sections: TestSection[];
  userAnswers: UserAnswer[];
  currentQuestion: number;
  onQuestionClick: (questionNumber: number) => void;
  onSectionClick: (sectionId: string) => void;
  onSubmit?: () => void;
}

const TestNavigation: React.FC<TestNavigationProps> = ({
  sections,
  userAnswers,
  currentQuestion,
  onQuestionClick,
  onSectionClick,
  onSubmit,
}) => {
  // Tổng số câu trong tất cả section
  const totalQuestions = sections.reduce((sum, section) => {
    const [start, end] = section.questionRange;
    return sum + (end - start + 1);
  }, 0);

  const answeredQuestions = userAnswers.filter((a) => a.isAnswered).length;
  const progressPercent =
    totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Tạo map questionNumber -> trạng thái
  const answeredMap = new Map<number, boolean>();
  userAnswers.forEach((a) => {
    answeredMap.set(a.questionNumber, a.isAnswered);
  });

  return (
    <div className={styles.navigationContainer}>
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <h3 className={styles.progressTitle}>Tiến độ làm bài</h3>
          <span className={styles.progressPercent}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress
          percent={Math.round(progressPercent)}
          size="small"
          showInfo={false}
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <p className={styles.progressText}>
          {answeredQuestions}/{totalQuestions} câu
        </p>
      </div>

      <div className={styles.menuSection}>
        {sections.map((section) => {
          const [startQ, endQ] = section.questionRange;
          const numbers: number[] = [];
          for (let q = startQ; q <= endQ; q++) {
            numbers.push(q);
          }

          return (
            <div key={section._id} className={styles.sectionBlock}>
              <div
                className={styles.sectionTitle}
                onClick={() => onSectionClick(section._id)}
              >
                {section.title}
              </div>
              <div className={styles.questionsGrid}>
                {numbers.map((qNum) => {
                  const isAnswered = answeredMap.get(qNum) || false;
                  const isCurrent = qNum === currentQuestion;

                  return (
                    <button
                      key={qNum}
                      type="button"
                      className={`${styles.questionSquare} ${
                        isCurrent ? styles.currentSquare : ''
                      } ${isAnswered ? styles.answeredSquare : ''}`}
                      onClick={() => onQuestionClick(qNum)}
                      aria-label={`Câu ${qNum}`}
                    >
                      <span>{qNum}</span>
                      {isAnswered && (
                        <CheckOutlined className={styles.squareCheckIcon} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <Button
          type="primary"
          block
          size="large"
          onClick={onSubmit}
        >
          Nộp bài
        </Button>
      </div>
    </div>
  );
};

export default TestNavigation;

