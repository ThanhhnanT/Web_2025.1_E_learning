import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type FlashcardProgressDocument = HydratedDocument<FlashcardProgress>;

@Schema({ timestamps: true })
export class FlashcardProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // ID người dùng

  @Prop({ type: Types.ObjectId, ref: 'FlashcardDeck', required: true })
  deckId: Types.ObjectId; // ID của deck

  @Prop({ type: Number, default: 0 })
  learned: number; // Số từ đã học

  @Prop({ type: Number, default: 0 })
  remembered: number; // Số từ đã nhớ

  @Prop({ type: Number, default: 0 })
  review: number; // Số từ cần ôn lại

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  wordStatus: { [word: string]: string }; // Trạng thái từng từ: "new", "learned", "remembered", "review"
}

export const FlashcardProgressSchema = SchemaFactory.createForClass(FlashcardProgress);

// Thêm indexes để tìm kiếm nhanh hơn
FlashcardProgressSchema.index({ userId: 1 });
FlashcardProgressSchema.index({ deckId: 1 });
FlashcardProgressSchema.index({ userId: 1, deckId: 1 }, { unique: true }); // Composite unique index

