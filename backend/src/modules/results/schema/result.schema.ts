import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ResultDocument = HydratedDocument<Result>;

@Schema({ timestamps: true })
export class Result {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Answer', required: true })
  answerId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  userAnswer: any; // Câu trả lời của user (có thể là string, array, object...)

  @Prop({ type: Number, required: true, min: 0 })
  score: number; // Điểm số

  @Prop({ type: Number, required: true, min: 1 })
  totalQuestions: number; // Tổng số câu hỏi

  @Prop({ type: Number, required: true, min: 0 })
  correctAnswers: number; // Số câu trả lời đúng

  @Prop({ type: Number, required: true, min: 0 })
  timeSpent: number; // Thời gian làm bài (phút)

  @Prop({ type: Date })
  completedAt: Date; // Thời gian hoàn thành bài test

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

