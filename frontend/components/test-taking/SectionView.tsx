"use client";

import React, { useRef, ReactNode, useEffect } from 'react';
import { Card, Typography, Divider, Button } from 'antd';
import styles from '@/styles/sectionView.module.css';
import { TestSection, QuestionGroup } from '@/types/test';
import QuestionRenderer from './QuestionRenderer';

const { Title, Paragraph } = Typography;

interface SectionViewProps {
  section: TestSection;
  userAnswers: Record<number, string[]>;
  onAnswerChange: (questionNumber: number, answer: string[]) => void;
  showTranscript?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  /**
   * Optional map of questionNumber -> HTMLElement used by the navigation panel
   * to scroll & focus the correct input when a question number is clicked.
   */
  questionInputMapRef?: React.MutableRefObject<
    Map<number, HTMLElement | null> | null
  >;
  /**
   * Called khi user focus/gõ vào một câu hỏi bất kỳ trong section này.
   */
  onQuestionFocus?: (questionNumber: number) => void;
}

const SectionView: React.FC<SectionViewProps> = ({
  section,
  userAnswers,
  onAnswerChange,
  showTranscript = false,
  header,
  footer,
  questionInputMapRef,
  onQuestionFocus,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const localMapRef = useRef<Map<number, HTMLElement | null>>(new Map());

  // On mount, if parent provided a map ref, sync our local map into it
  useEffect(() => {
    if (!questionInputMapRef) return;
    if (!questionInputMapRef.current) {
      questionInputMapRef.current = new Map();
    }
    const globalMap = questionInputMapRef.current;

    // Merge local entries into the global map
    localMapRef.current.forEach((el, qNum) => {
      globalMap.set(qNum, el);
    });

    // Cleanup: remove our entries when this section unmounts
    return () => {
      localMapRef.current.forEach((_el, qNum) => {
        globalMap.delete(qNum);
      });
    };
  }, [questionInputMapRef]);

  const registerInputRef = (questionNumber: number, el: any | null) => {
    let domEl: HTMLElement | null = null;

    // Antd Input: instance with `.input`
    if (el && typeof el === 'object') {
      if ('input' in el && (el as any).input instanceof HTMLElement) {
        domEl = (el as any).input as HTMLElement;
      } else if (
        'resizableTextArea' in el &&
        (el as any).resizableTextArea?.textArea instanceof HTMLElement
      ) {
        // Antd TextArea: instance with `.resizableTextArea.textArea`
        domEl = (el as any).resizableTextArea.textArea as HTMLElement;
      } else if (el instanceof HTMLElement) {
        domEl = el;
      }
    }

    localMapRef.current.set(questionNumber, domEl);
    if (questionInputMapRef && questionInputMapRef.current) {
      questionInputMapRef.current.set(questionNumber, domEl);
    }
  };

  const renderResourcesContent = () => {
    const hasAudio = Boolean(section.resources.audio);
    const hasPassage = Boolean(section.resources.passageHtml);
    const hasInstructions = Boolean(section.resources.instructions);

    if (!hasAudio && !hasPassage && !hasInstructions) return null;

    return (
      <>
        {hasAudio && (
          <div className={styles.audioBlock}>
            <audio
              ref={audioRef}
              controls
              className={styles.audioPlayer}
              src={section.resources.audio}
            >
              Your browser does not support the audio element.
            </audio>
            {showTranscript && section.resources.transcriptHtml && (
              <div className={styles.transcript}>
                <Divider />
                <div
                  className={styles.transcriptContent}
                  dangerouslySetInnerHTML={{
                    __html: section.resources.transcriptHtml || '',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {hasInstructions && (
          <Paragraph className={styles.instructions}>
            {section.resources.instructions}
          </Paragraph>
        )}

        {hasPassage && (
          <div
            className={styles.passageContent}
            dangerouslySetInnerHTML={{
              __html: section.resources.passageHtml || '',
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.sectionContainer}>
      <Card className={styles.resourcesCard} size="small">
        {header && (
          <div className={styles.sectionHeader}>
            {header}
          </div>
        )}

        {renderResourcesContent()}

        {section.questionGroups?.map((group) => (
          <div key={group._id} className={styles.questionGroupBlock}>
   

            <div className={styles.groupContentLayout}>
              <div>
                {group.sharedContent?.contextHtml && (
                  <div
                    className={styles.sharedPassage}
                    dangerouslySetInnerHTML={{
                      __html: group.sharedContent.contextHtml,
                    }}
                  />
                )}

                {/* Giữ lại passage cho các bài đọc nếu có */}
                {group.sharedContent?.passage &&
                  !group.sharedContent?.contextHtml && (
                    <div
                      className={styles.sharedPassage}
                      dangerouslySetInnerHTML={{
                        __html: group.sharedContent.passage,
                      }}
                    />
                  )}

                {group.sharedContent?.diagram && (
                  <div className={styles.diagramContainer}>
                    <img
                      src={group.sharedContent.diagram}
                      alt="Diagram"
                      className={styles.diagram}
                    />
                  </div>
                )}
              </div>

              <div className={styles.questionsContainer}>
                {group.questions?.map((question) => (
                  <QuestionRenderer
                    key={question._id}
                    question={question}
                    userAnswer={userAnswers[question.questionNumber] || []}
                    onAnswerChange={(answer) =>
                      onAnswerChange(question.questionNumber, answer)
                    }
                    hideQuestionText
                    registerInputRef={registerInputRef}
                    onQuestionFocus={onQuestionFocus}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {footer && (
          <div className={styles.sectionFooter}>
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SectionView;

