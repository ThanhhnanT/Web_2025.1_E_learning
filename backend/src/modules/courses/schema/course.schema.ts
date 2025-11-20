import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, required: true, enum: ['English', 'Chinese'] })
  language: string;

  @Prop({ type: String, required: true })
  level: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: String })
  thumbnail_url: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  instructor: Types.ObjectId;

  @Prop({ type: String, enum: ['draft', 'published'], default: 'draft' })
  status: string;

  @Prop({ type: Number, default: 0 })
  totalStudents: number;

  @Prop({ type: Number, default: 0 })
  totalModules: number;

  @Prop({ type: [String], default: [] })
  tags: Array<string>;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Thêm indexes để tìm kiếm nhanh hơn
CourseSchema.index({ instructor: 1 });
CourseSchema.index({ language: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ language: 1, status: 1 }); // Composite index

