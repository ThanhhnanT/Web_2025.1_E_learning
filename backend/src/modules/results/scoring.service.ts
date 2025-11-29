import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Result, QuestionAnswer, SectionScore } from './schema/result.schema';
import { Test } from '../tests/schema/test.schema';
import { TestSection } from '../test-sections/schema/test-section.schema';
import { Question } from '../questions/schema/question.schema';

export interface RawUserAnswer {
  questionNumber: number;
  userAnswer: string[];
  timeSpent?: number;
}

export interface ScoringPayload {
  userId: string;
  testId: string;
  answers: RawUserAnswer[];
  timeSpent?: number;
  completedAt?: Date;
  selectedSectionIds?: string[];
}

export interface ScoringResult {
  resultData: Partial<Result>;
  detailedAnswers: QuestionAnswer[];
  sectionScores: SectionScore[];
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectModel(Test.name) private readonly testModel: Model<Test>,
    @InjectModel(TestSection.name)
    private readonly testSectionModel: Model<TestSection>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<Question>,
  ) {}

  /**
   * Tính điểm cho một bài test IELTS (ưu tiên Listening/Reading)
   */
  async scoreTest(payload: ScoringPayload): Promise<ScoringResult> {
    const testObjectId = new Types.ObjectId(payload.testId);

    const [test, sections, questions] = await Promise.all([
      this.testModel.findById(testObjectId).exec(),
      this.testSectionModel
        .find({ testId: testObjectId, deletedAt: null })
        .sort({ order: 1 })
        .exec(),
      this.questionModel
        .find({ deletedAt: null })
        .sort({ questionNumber: 1 })
        .exec(),
    ]);

    if (!test) {
      throw new Error('Test not found');
    }

    // Map questionNumber -> Question
    const questionByNumber = new Map<number, Question>();
    questions.forEach((q) => {
      questionByNumber.set(q.questionNumber, q);
    });

    const detailedAnswers: QuestionAnswer[] = [];

    let totalQuestions = 0;
    let correctAnswers = 0;
    let totalPoints = 0;

    // Map sectionId -> counters
    const sectionCounters = new Map<
      string,
      { sectionId: Types.ObjectId; sectionType: string; correct: number; total: number }
    >();

    const normalizeToken = (value: string) =>
      (value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const isCorrectAnswer = (question: Question, userValues: string[]): boolean => {
      if (!userValues || userValues.length === 0) return false;

      const correctValues = question.correctAnswer?.value || [];
      const alternatives = question.correctAnswer?.alternatives || [];

      // Chuẩn hóa tất cả value
      const allAccepted = [...correctValues, ...alternatives].map(normalizeToken);

      const userNorm = userValues.map(normalizeToken).filter((v) => v.length > 0);
      if (userNorm.length === 0) return false;

      // Với các dạng lựa chọn (MCQ, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, MATCHING, MULTIPLE_CHOICE_MULTIPLE_ANSWERS)
      // ta so sánh set value
      switch (question.questionType) {
        case 'multiple_choice':
        case 'true_false_notgiven':
        case 'yes_no_notgiven':
        case 'matching':
        case 'multiple_choice_multiple_answers': {
          const correctSet = new Set(allAccepted);
          return (
            userNorm.length === correctValues.length &&
            userNorm.every((u) => correctSet.has(u))
          );
        }
        default: {
          // Các dạng fill-in: chỉ cần ít nhất một user answer nằm trong danh sách chấp nhận
          return userNorm.some((u) => allAccepted.includes(u));
        }
      }
    };

    // Chuẩn bị map để tìm section theo questionNumber
    const findSectionForQuestion = (qNum: number): TestSection | undefined => {
      return sections.find((sec) => {
        const [start, end] = sec.questionRange || [0, 0];
        return qNum >= start && qNum <= end;
      });
    };

    // Set để track các section đã được user làm (có ít nhất 1 câu trả lời)
    const sectionsAttempted = new Set<string>();

    for (const userAns of payload.answers) {
      const question = questionByNumber.get(userAns.questionNumber);
      if (!question) {
        continue;
      }

      totalQuestions += 1;
      totalPoints += question.points || 1;

      const correct = isCorrectAnswer(question, userAns.userAnswer);
      if (correct) {
        correctAnswers += 1;
      }

      const section = findSectionForQuestion(userAns.questionNumber);
      if (section) {
        const sectionAny: any = section as any;
        const key = sectionAny._id?.toString();
        if (!key) {
          continue;
        }
        // Đánh dấu section này đã được làm
        sectionsAttempted.add(key);
        
        if (!sectionCounters.has(key)) {
          sectionCounters.set(key, {
            sectionId: sectionAny._id as Types.ObjectId,
            sectionType: section.sectionType,
            correct: 0,
            total: 0,
          });
        }
        const counter = sectionCounters.get(key)!;
        counter.total += 1;
        if (correct) {
          counter.correct += 1;
        }
      }

      const questionAny: any = question as any;
      const qa: QuestionAnswer = {
        questionId: questionAny._id as Types.ObjectId,
        questionNumber: question.questionNumber,
        userAnswer: userAns.userAnswer || [],
        isCorrect: correct,
        timeSpent: userAns.timeSpent,
      };
      detailedAnswers.push(qa);
    }

    // Tính tổng số câu của các section mà user đã chọn làm (dựa vào selectedSectionIds hoặc sectionsAttempted)
    // Ưu tiên dùng selectedSectionIds nếu có (từ frontend), nếu không thì dùng sectionsAttempted
    let totalQuestionsInSelectedSections = 0;
    const sectionsToCount = payload.selectedSectionIds && payload.selectedSectionIds.length > 0
      ? payload.selectedSectionIds
      : Array.from(sectionsAttempted);
    
    sections.forEach((section) => {
      const sectionAny: any = section as any;
      const key = sectionAny._id?.toString();
      if (key && sectionsToCount.includes(key)) {
        const [start, end] = section.questionRange || [0, 0];
        totalQuestionsInSelectedSections += end - start + 1;
      }
    });

    // Nếu không có section nào được chọn/làm, fallback về số câu đã trả lời
    const finalTotalQuestions = totalQuestionsInSelectedSections > 0 
      ? totalQuestionsInSelectedSections 
      : totalQuestions;

    // Quy đổi số câu đúng -> band IELTS
    // Nếu user làm đủ 40 câu thì dùng bảng chuẩn, nếu không thì tính theo %
    const bandScore = this.mapCorrectToBand(correctAnswers, finalTotalQuestions, test.skill);

    const sectionScores: SectionScore[] = [];
    
    // Thêm scores cho các sections đã chọn (có thể có hoặc không có câu trả lời)
    sectionsToCount.forEach((sectionIdStr) => {
      const section = sections.find((sec) => {
        const sectionAny: any = sec as any;
        return sectionAny._id?.toString() === sectionIdStr;
      });
      
      if (!section) return;
      
      const [start, end] = section.questionRange || [0, 0];
      const totalQuestionsInSection = end - start + 1;
      
      // Tìm counter nếu section này có câu trả lời
      const counter = sectionCounters.get(sectionIdStr);
      const correct = counter?.correct || 0;
      const answered = counter?.total || 0;
      
      const sectionAny: any = section as any;
      const secBand = this.mapCorrectToBand(
        correct,
        totalQuestionsInSection,
        section.sectionType,
      );
      
      sectionScores.push({
        sectionId: sectionAny._id as Types.ObjectId,
        sectionType: section.sectionType,
        correctAnswers: correct,
        totalQuestions: totalQuestionsInSection,
        bandScore: secBand,
      });
    });

    const resultData: Partial<Result> = {
      userId: new Types.ObjectId(payload.userId),
      testId: test._id as Types.ObjectId,
      answers: detailedAnswers,
      score: correctAnswers, // tạm thời = số câu đúng
      bandScore,
      totalQuestions: finalTotalQuestions,
      correctAnswers,
      timeSpent: payload.timeSpent ?? 0,
      completedAt: payload.completedAt ?? new Date(),
      sectionScores,
    } as any;

    return {
      resultData,
      detailedAnswers,
      sectionScores,
    };
  }

  /**
   * Bảng quy đổi đơn giản số câu đúng -> band IELTS.
   * Có thể tinh chỉnh lại sau cho từng skill/section.
   */
  private mapCorrectToBand(
    correct: number,
    total: number,
    skillOrSectionType?: string,
  ): number {
    if (!total || total <= 0) return 0;

    const isIELTSListeningOrReading =
      skillOrSectionType === 'listening' ||
      skillOrSectionType === 'reading' ||
      skillOrSectionType === 'IELTS';

    // Bảng quy đổi chuẩn cho IELTS Listening/Reading 40 câu
    if (isIELTSListeningOrReading && total === 40) {
      const c = correct;
      if (c >= 39) return 9.0;
      if (c >= 37) return 8.5;
      if (c >= 35) return 8.0;
      if (c >= 33) return 7.5;
      if (c >= 30) return 7.0;
      if (c >= 27) return 6.5;
      if (c >= 23) return 6.0;
      if (c >= 20) return 5.5;
      if (c >= 16) return 5.0;
      if (c >= 13) return 4.5;
      if (c >= 10) return 4.0;
      if (c >= 7) return 3.5;
      if (c >= 5) return 3.0;
      if (c >= 3) return 2.5;
      if (c >= 1) return 2.0;
      return 0;
    }

    // Mặc định: mapping gần đúng theo % (dùng cho các phần nhỏ/section)
    const percent = (correct / total) * 100;
    if (percent >= 90) return 9;
    if (percent >= 80) return 8;
    if (percent >= 70) return 7;
    if (percent >= 60) return 6;
    if (percent >= 50) return 5;
    if (percent >= 40) return 4;
    if (percent >= 30) return 3;
    if (percent >= 20) return 2.5;
    if (percent > 0) return 2;
    return 0;
  }
}


