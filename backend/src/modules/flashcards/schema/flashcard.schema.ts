import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FlashcardDocument = HydratedDocument<Flashcard>;

@Schema({ timestamps: true })
export class Flashcard {
  @Prop({ type: String, required: true })
  front: string; // Mặt trước của thẻ

  @Prop({ type: String, required: true })
  back: string; // Mặt sau của thẻ

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId | null; // Optional - có thể gắn với course

  @Prop({ type: Types.ObjectId, ref: 'Lesson' })
  lessonId: Types.ObjectId | null; // Optional - có thể gắn với lesson

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Người tạo flashcard

  @Prop({ type: String })
  deckName: string; // Tên bộ thẻ (optional)

  @Prop({ type: [String], default: [] })
  tags: Array<string>;

  @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string;

  @Prop({ type: Number, default: 0 })
  reviewCount: number; // Số lần đã review

  @Prop({ type: Date })
  lastReviewed: Date | null; // Lần review cuối cùng

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const FlashcardSchema = SchemaFactory.createForClass(Flashcard);

// Thêm indexes để tìm kiếm nhanh hơn
FlashcardSchema.index({ userId: 1 });
FlashcardSchema.index({ courseId: 1 });
FlashcardSchema.index({ lessonId: 1 });
FlashcardSchema.index({ deckName: 1 });
FlashcardSchema.index({ deletedAt: 1 });
FlashcardSchema.index({ userId: 1, deletedAt: 1 }); // Composite index

