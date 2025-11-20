import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: 'Module', required: true })
  moduleId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, required: true, min: 1 })
  order: number;

  @Prop({ type: String, required: true, enum: ['video', 'text', 'quiz'] })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: any; // Có thể là video_url, text_content, hoặc quiz_data

  @Prop({ type: Number, min: 0 })
  duration: number; // Thời gian (phút)

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

// Thêm indexes để tìm kiếm nhanh hơn
LessonSchema.index({ moduleId: 1 });
LessonSchema.index({ moduleId: 1, order: 1 }); // Composite index
LessonSchema.index({ deletedAt: 1 });

