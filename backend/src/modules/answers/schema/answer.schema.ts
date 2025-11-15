import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: 'Content', required: true })
  contentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  correctAnswer: any; // Đáp án đúng (có thể là string, array, object...)

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

// Thêm indexes để tìm kiếm nhanh hơn
AnswerSchema.index({ contentId: 1 });
AnswerSchema.index({ deletedAt: 1 });

