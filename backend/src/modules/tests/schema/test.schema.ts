import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

export enum TestType {
  IELTS = 'IELTS',
  HSK = 'HSK',
  TOEFL = 'TOEFL',
  TOEIC = 'TOEIC',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Test {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, enum: Object.values(TestType), default: TestType.OTHER })
  testType: TestType;

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

  // New fields for the restructured database
  @Prop({ type: String, unique: true, sparse: true })
  externalSlug: string; // For crawler integration (e.g., 'cambridge-ielts-020-listening-test-01')

  @Prop({ type: String })
  series: string; // e.g., 'Cambridge IELTS 20'

  @Prop({ type: String })
  testNumber: string; // e.g., 'Test 1'

  @Prop({ type: String })
  skill: string; // e.g., 'listening', 'reading'

  @Prop({ type: String })
  sourceUrl: string; // URL where the test was sourced from
}

export const TestSchema = SchemaFactory.createForClass(Test);

// Indexes for better query performance
TestSchema.index({ testType: 1 });
TestSchema.index({ externalSlug: 1 });
TestSchema.index({ series: 1 });
TestSchema.index({ skill: 1 });