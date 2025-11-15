import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

@Schema({ timestamps: true })
export class Test {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true, enum: ['English', 'Chinese'] })
  language: string; 

  @Prop({ type: String, required: true })
  level: string; 

  @Prop({ type: Number, required: true, min: 1 })
  durationMinutes: number; 

  @Prop({ type: Number })
  totalQuestions: number;

  @Prop({ type: Number, default: 0 })
  totalUser: number;

  @Prop({ type: Number, default: 0 })
  totalComment: number;

  @Prop({ type: [String], default: [] })
  hastag: Array<string>;

  @Prop({ type: String })
  description: string; 

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId; 
}

export const TestSchema = SchemaFactory.createForClass(Test);