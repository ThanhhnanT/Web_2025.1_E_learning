"use client";

import React, { useState } from 'react';
import { Card, Statistic, Row, Col, Progress, Tabs, Button, Select, Empty } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import styles from '@/styles/reviewPanel.module.css';
import { TestResult, Question, TestSection } from '@/types/test';
import QuestionRenderer from './QuestionRenderer';

const { TabPane } = Tabs;

interface ReviewPanelProps {
  result: TestResult;
  test: {
    title: string;
    sections: TestSection[];
  };
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ result, test }) => {
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Calculate statistics
  const accuracyPercent = (result.correctAnswers / result.totalQuestions) * 100;
  const avgTimePerQuestion = result.timeSpent / result.totalQuestions;

  // Get all questions from test
  const allQuestions: Question[] = [];
  test.sections.forEach(section => {
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
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Score"
              value={result.score}
              suffix={`/ ${result.totalQuestions}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Accuracy"
              value={accuracyPercent.toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: accuracyPercent >= 70 ? '#52c41a' : '#ff4d4f' }}
            />
            <Progress 
              percent={accuracyPercent} 
              showInfo={false}
              strokeColor={accuracyPercent >= 70 ? '#52c41a' : '#ff4d4f'}
              size="small"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Correct Answers"
              value={result.correctAnswers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Time Spent"
              value={result.timeSpent}
              suffix="min"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className={styles.avgTime}>
              Avg: {avgTimePerQuestion.toFixed(1)}min/question
            </div>
          </Col>
        </Row>
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
              {test.sections.map(section => (
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

    return (
      <div className={styles.questionsContainer}>
        {filteredQuestions.map(question => {
          const answer = result.answers.find(a => a.questionNumber === question.questionNumber);
          const userAnswer = answer?.userAnswer || [];
          
          return (
            <QuestionRenderer
              key={question._id}
              question={question}
              userAnswer={userAnswer}
              onAnswerChange={() => {}} // Read-only in review mode
              showCorrectAnswer={true}
              isReviewMode={true}
            />
          );
        })}
      </div>
    );
  };

  const renderSectionBreakdown = () => {
    return (
      <Card className={styles.breakdownCard}>
        <h3 className={styles.breakdownTitle}>Performance by Section</h3>
        {test.sections.map(section => {
          const [start, end] = section.questionRange;
          const sectionQuestions = result.answers.filter(
            a => a.questionNumber >= start && a.questionNumber <= end
          );
          const correctInSection = sectionQuestions.filter(a => a.isCorrect).length;
          const totalInSection = sectionQuestions.length;
          const sectionPercent = totalInSection > 0 ? (correctInSection / totalInSection) * 100 : 0;

          return (
            <div key={section._id} className={styles.sectionItem}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.sectionScore}>
                  {correctInSection} / {totalInSection}
                </span>
              </div>
              <Progress 
                percent={sectionPercent}
                strokeColor={sectionPercent >= 70 ? '#52c41a' : '#ff4d4f'}
                format={percent => `${percent?.toFixed(0)}%`}
              />
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
      {renderFilters()}

      <Tabs defaultActiveKey="review" className={styles.tabs}>
        <TabPane tab="Question Review" key="review">
          {renderQuestionReview()}
        </TabPane>
        <TabPane tab="Performance Analysis" key="analysis">
          <Card>
            <p>Detailed performance analysis coming soon...</p>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReviewPanel;

