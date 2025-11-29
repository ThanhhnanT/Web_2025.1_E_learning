import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ResultDocument = HydratedDocument<Result>;

export interface QuestionAnswer {
  questionId: Types.ObjectId; // Reference to Question
  questionNumber: number;
  userAnswer: string[]; // Array to support multiple answers
  isCorrect: boolean;
  timeSpent?: number; // Time spent on this question in seconds
}

export interface ReviewNote {
  questionId: Types.ObjectId;
  note: string;
  createdAt: Date;
}

export interface SectionScore {
  sectionId: Types.ObjectId;
  sectionType: string;
  correctAnswers: number;
  totalQuestions: number;
  bandScore?: number;
}

@Schema({ timestamps: true })
export class Result {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  // DEPRECATED: Keep for backward compatibility, but new attempts should use answers array
  @Prop({ type: Types.ObjectId, ref: 'Answer' })
  answerId?: Types.ObjectId;

  // DEPRECATED: Keep for backward compatibility
  @Prop({ type: MongooseSchema.Types.Mixed })
  userAnswer?: any;

  // NEW: Detailed answer tracking per question
  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  answers: QuestionAnswer[];

  @Prop({ type: Number, required: true, min: 0 })
  score: number; // Điểm số

  @Prop({ type: Number, min: 0, max: 9 })
  bandScore?: number; // Điểm band IELTS tổng (0–9, có .5)

  @Prop({ type: Number, required: true, min: 1 })
  totalQuestions: number; // Tổng số câu hỏi

  @Prop({ type: Number, required: true, min: 0 })
  correctAnswers: number; // Số câu trả lời đúng (renamed from correctAnswers)

  @Prop({ type: Number, required: true, min: 0 })
  timeSpent: number; // Thời gian làm bài (phút)

  @Prop({ type: Date })
  completedAt: Date; // Thời gian hoàn thành bài test

  // Thống kê điểm theo từng section/skill
  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  sectionScores?: SectionScore[];

  // NEW: Review notes for wrong answers
  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  reviewNotes: ReviewNote[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const ResultSchema = SchemaFactory.createForClass(Result);

// Thêm indexes để tìm kiếm nhanh hơn
ResultSchema.index({ userId: 1 });
ResultSchema.index({ testId: 1 });
ResultSchema.index({ answerId: 1 });
ResultSchema.index({ userId: 1, testId: 1 }); // Composite index
ResultSchema.index({ deletedAt: 1 });

