import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Test', required: false })
  testId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: false })
  courseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string; // Nội dung comment

  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number; // Star rating (1-5), used for course reviews

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Thêm indexes để tìm kiếm nhanh hơn
CommentSchema.index({ testId: 1 });
CommentSchema.index({ courseId: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ rating: 1 });
CommentSchema.index({ testId: 1, deletedAt: 1 }); // Composite index
CommentSchema.index({ courseId: 1, deletedAt: 1 }); // Composite index
CommentSchema.index({ deletedAt: 1 });

