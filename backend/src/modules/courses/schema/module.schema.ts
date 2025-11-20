import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ModuleDocument = HydratedDocument<Module>;

@Schema({ timestamps: true })
export class Module {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, required: true, min: 1 })
  order: number;

  @Prop({ type: Number, default: 0 })
  totalLessons: number;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);

// Thêm indexes để tìm kiếm nhanh hơn
ModuleSchema.index({ courseId: 1 });
ModuleSchema.index({ courseId: 1, order: 1 }); // Composite index

