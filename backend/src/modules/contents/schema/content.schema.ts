import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ContentDocument = HydratedDocument<Content>;

@Schema({ timestamps: true })
export class Content {
  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  questionContent: any; 
}

export const ContentSchema = SchemaFactory.createForClass(Content);

// Thêm index cho testId để tìm kiếm nhanh hơn
ContentSchema.index({ testId: 1 });
ContentSchema.index({ deletedAt: 1 });
