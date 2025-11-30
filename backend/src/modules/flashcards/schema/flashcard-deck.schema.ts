import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FlashcardDeckDocument = HydratedDocument<FlashcardDeck>;

@Schema({ timestamps: true })
export class FlashcardDeck {
  @Prop({ type: String, required: true })
  name: string; // Tên bộ thẻ

  @Prop({ type: String })
  description?: string; // Mô tả

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId; // ID người tạo

  @Prop({ type: Number, default: 0 })
  wordCount: number; // Số lượng từ trong deck

  @Prop({ type: Number, default: 0 })
  userCount: number; // Số người đã sử dụng deck này

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const FlashcardDeckSchema = SchemaFactory.createForClass(FlashcardDeck);

// Thêm indexes để tìm kiếm nhanh hơn
FlashcardDeckSchema.index({ createdBy: 1 });
FlashcardDeckSchema.index({ deletedAt: 1 });
FlashcardDeckSchema.index({ createdBy: 1, deletedAt: 1 }); // Composite index

