import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FlashcardDocument = HydratedDocument<Flashcard>;

@Schema({ timestamps: true })
export class Flashcard {
  // Format từ vựng
  @Prop({ type: String, required: true })
  word: string; // Từ vựng

  @Prop({ type: String, required: true })
  type: string; // Loại từ: noun, verb, adjective, etc.

  @Prop({ type: String, required: true })
  phonetic: string; // Phiên âm

  @Prop({ type: String, required: true })
  definition: string; // Định nghĩa

  @Prop({ type: String, required: true })
  example: string; // Ví dụ

  @Prop({ type: String })
  image?: string; // URL hình ảnh

  @Prop({ type: String })
  audio?: string; // URL audio

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'FlashcardDeck', required: true })
  deckId: Types.ObjectId; // ID của deck

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // ID người tạo

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId | null; // Optional - có thể gắn với course

  @Prop({ type: Types.ObjectId, ref: 'Lesson' })
  lessonId: Types.ObjectId | null; // Optional - có thể gắn với lesson

  // Metadata
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
FlashcardSchema.index({ deckId: 1 });
FlashcardSchema.index({ courseId: 1 });
FlashcardSchema.index({ lessonId: 1 });
FlashcardSchema.index({ deletedAt: 1 });
FlashcardSchema.index({ userId: 1, deletedAt: 1 }); // Composite index
FlashcardSchema.index({ deckId: 1, deletedAt: 1 }); // Composite index

