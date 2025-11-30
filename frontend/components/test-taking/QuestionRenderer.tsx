"use client";

import React, { useId } from 'react';
import { Radio, Checkbox, Input, Select, Space } from 'antd';
import type { RadioChangeEvent, CheckboxChangeEvent } from 'antd';
import styles from '@/styles/questionRenderer.module.css';
import { Question, QuestionType } from '@/types/test';

const { TextArea } = Input;

interface QuestionRendererProps {
  question: Question;
  userAnswer: string[];
  onAnswerChange: (answer: string[]) => void;
  showCorrectAnswer?: boolean;
  isReviewMode?: boolean;
  hideQuestionText?: boolean;
  /**
   * Optional callback to expose the main answer input element for this question.
   * Used so the navigation panel can scroll & focus the corresponding input.
   */
  registerInputRef?: (questionNumber: number, el: any | null) => void;
  /**
   * Optional callback fired when this question gains user focus
   * (click vào ô trả lời, gõ đáp án, chọn lựa chọn, ...).
   */
  onQuestionFocus?: (questionNumber: number) => void;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  userAnswer,
  onAnswerChange,
  showCorrectAnswer = false,
  isReviewMode = false,
  hideQuestionText = false,
  registerInputRef,
  onQuestionFocus,
}) => {
  const baseId = useId();
  const isCorrect = showCorrectAnswer && 
    JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.value.sort());

  const renderMultipleChoice = () => {
    const currentValue = userAnswer.length > 0 ? userAnswer[0] : undefined;
    
    return (
      <Radio.Group
        value={currentValue}
        onChange={(e: RadioChangeEvent) => {
          onAnswerChange([e.target.value]);
          onQuestionFocus?.(question.questionNumber);
        }}
        disabled={isReviewMode}
        className={styles.radioGroup}
      >
        <Space direction="vertical" className={styles.optionsSpace}>
          {question.options?.map((option) => (
            <Radio 
              key={option.key} 
              value={option.key}
              className={`${styles.radioOption} ${
                showCorrectAnswer && question.correctAnswer.value.includes(option.key)
                  ? styles.correctOption
                  : ''
              } ${
                showCorrectAnswer && userAnswer.includes(option.key) && !question.correctAnswer.value.includes(option.key)
                  ? styles.incorrectOption
                  : ''
              }`}
            >
              <span className={styles.optionKey}>{option.key}.</span>
              <span className={styles.optionText}>{option.text}</span>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    );
  };

  const renderMultipleChoiceMultipleAnswers = () => {
    return (
      <Checkbox.Group
        value={userAnswer}
        onChange={(checkedValues) => {
          onAnswerChange(checkedValues as string[]);
          onQuestionFocus?.(question.questionNumber);
        }}
        disabled={isReviewMode}
        className={styles.checkboxGroup}
      >
        <Space direction="vertical" className={styles.optionsSpace}>
          {question.options?.map((option) => (
            <Checkbox 
              key={option.key} 
              value={option.key}
              className={`${styles.checkboxOption} ${
                showCorrectAnswer && question.correctAnswer.value.includes(option.key)
                  ? styles.correctOption
                  : ''
              } ${
                showCorrectAnswer && userAnswer.includes(option.key) && !question.correctAnswer.value.includes(option.key)
                  ? styles.incorrectOption
                  : ''
              }`}
            >
              <span className={styles.optionKey}>{option.key}.</span>
              <span className={styles.optionText}>{option.text}</span>
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    );
  };

  const renderFillInBlank = () => {
    return (
      <Input
        id={`question-input-${question.questionNumber}-${baseId}`}
        ref={(el) => registerInputRef?.(question.questionNumber, el)}
        onFocus={() => onQuestionFocus?.(question.questionNumber)}
        value={userAnswer.length > 0 ? userAnswer[0] : ''}
        onChange={(e) => onAnswerChange([e.target.value])}
        disabled={isReviewMode}
        className={`${styles.fillInput} ${
          showCorrectAnswer && isCorrect ? styles.correctInput : ''
        } ${
          showCorrectAnswer && !isCorrect && userAnswer.length > 0 ? styles.incorrectInput : ''
        }`}
        size="large"
      />
    );
  };

  const renderTrueFalseNotGiven = () => {
    const options = [
      { key: 'TRUE', text: 'TRUE' },
      { key: 'FALSE', text: 'FALSE' },
      { key: 'NOT GIVEN', text: 'NOT GIVEN' },
    ];

    return (
      <Radio.Group
        value={userAnswer.length > 0 ? userAnswer[0] : undefined}
        onChange={(e: RadioChangeEvent) => {
          onAnswerChange([e.target.value]);
          onQuestionFocus?.(question.questionNumber);
        }}
        disabled={isReviewMode}
        className={styles.tfngGroup}
      >
        <Space>
          {options.map((option) => (
            <Radio.Button 
              key={option.key} 
              value={option.key}
              className={`${styles.tfngButton} ${
                showCorrectAnswer && question.correctAnswer.value.includes(option.key)
                  ? styles.correctButton
                  : ''
              } ${
                showCorrectAnswer && userAnswer.includes(option.key) && !question.correctAnswer.value.includes(option.key)
                  ? styles.incorrectButton
                  : ''
              }`}
            >
              {option.text}
            </Radio.Button>
          ))}
        </Space>
      </Radio.Group>
    );
  };

  const renderYesNoNotGiven = () => {
    const options = [
      { key: 'YES', text: 'YES' },
      { key: 'NO', text: 'NO' },
      { key: 'NOT GIVEN', text: 'NOT GIVEN' },
    ];

    return (
      <Radio.Group
        value={userAnswer.length > 0 ? userAnswer[0] : undefined}
        onChange={(e: RadioChangeEvent) => {
          onAnswerChange([e.target.value]);
          onQuestionFocus?.(question.questionNumber);
        }}
        disabled={isReviewMode}
        className={styles.tfngGroup}
      >
        <Space>
          {options.map((option) => (
            <Radio.Button 
              key={option.key} 
              value={option.key}
              className={`${styles.tfngButton} ${
                showCorrectAnswer && question.correctAnswer.value.includes(option.key)
                  ? styles.correctButton
                  : ''
              } ${
                showCorrectAnswer && userAnswer.includes(option.key) && !question.correctAnswer.value.includes(option.key)
                  ? styles.incorrectButton
                  : ''
              }`}
            >
              {option.text}
            </Radio.Button>
          ))}
        </Space>
      </Radio.Group>
    );
  };

  const renderShortAnswer = () => {
    return (
      <TextArea
        id={`question-input-${question.questionNumber}-${baseId}`}
        ref={(el) => registerInputRef?.(question.questionNumber, el)}
        onFocus={() => onQuestionFocus?.(question.questionNumber)}
        value={userAnswer.length > 0 ? userAnswer[0] : ''}
        onChange={(e) => onAnswerChange([e.target.value])}
        disabled={isReviewMode}
        placeholder="Write your answer here"
        autoSize={{ minRows: 3, maxRows: 6 }}
        className={`${styles.textArea} ${
          showCorrectAnswer && isCorrect ? styles.correctInput : ''
        } ${
          showCorrectAnswer && !isCorrect && userAnswer.length > 0 ? styles.incorrectInput : ''
        }`}
      />
    );
  };

  const renderQuestionContent = () => {
    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return renderMultipleChoice();
      case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS:
        return renderMultipleChoiceMultipleAnswers();
      case QuestionType.FILL_IN_BLANK:
      case QuestionType.SENTENCE_COMPLETION:
      case QuestionType.DIAGRAM_LABELING:
      case QuestionType.TABLE_COMPLETION:
        return renderFillInBlank();
      case QuestionType.TRUE_FALSE_NOTGIVEN:
        return renderTrueFalseNotGiven();
      case QuestionType.YES_NO_NOTGIVEN:
        return renderYesNoNotGiven();
      case QuestionType.SHORT_ANSWER:
        return renderShortAnswer();
      case QuestionType.MATCHING:
        return renderMultipleChoice(); // Simplified for now
      default:
        return renderFillInBlank();
    }
  };

  // Layout rút gọn: chỉ số câu + ô trả lời nằm ngang, dùng khi ẩn nội dung câu hỏi
  if (hideQuestionText && !showCorrectAnswer) {
    return (
      <div className={styles.compactQuestionRow}>
        <span className={styles.compactQuestionNumber}>
          {question.questionNumber}
        </span>
        <div className={styles.compactAnswerWrapper}>
          {renderQuestionContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.questionContainer} ${
        showCorrectAnswer && isCorrect ? styles.correctQuestion : ''
      } ${
        showCorrectAnswer && !isCorrect && userAnswer.length > 0
          ? styles.incorrectQuestion
          : ''
      }`}
    >
      <div className={styles.questionHeader}>
        <span className={styles.questionNumber}>{question.questionNumber}</span>
        {showCorrectAnswer && (
          <span
            className={isCorrect ? styles.correctBadge : styles.incorrectBadge}
          >
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        )}
      </div>

      {!hideQuestionText && (
        <div
          className={styles.questionText}
          dangerouslySetInnerHTML={{ __html: question.questionText }}
        />
      )}

      <div className={styles.answerSection}>{renderQuestionContent()}</div>

      {showCorrectAnswer && !isCorrect && (
        <div className={styles.correctAnswerSection}>
          <strong>Correct Answer:</strong> {question.correctAnswer.value.join(', ')}
          {question.correctAnswer.alternatives && question.correctAnswer.alternatives.length > 0 && (
            <span className={styles.alternatives}>
              {' '}(Also acceptable: {question.correctAnswer.alternatives.join(', ')})
            </span>
          )}
        </div>
      )}

      {showCorrectAnswer && question.explanation?.explanationHtml && (
        <div className={styles.explanationSection}>
          <strong>Explanation:</strong>
          <div dangerouslySetInnerHTML={{ __html: question.explanation.explanationHtml }} />
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;

