import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type TestSectionDocument = HydratedDocument<TestSection>;

export enum SectionType {
  LISTENING = 'listening',
  READING = 'reading',
  WRITING = 'writing',
  SPEAKING = 'speaking',
}

export interface SectionResources {
  audio?: string;
  passageHtml?: string;
  transcriptHtml?: string;
  transcriptText?: string;
  instructions?: string;
}

@Schema({ timestamps: true })
export class TestSection {
  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(SectionType), required: true })
  sectionType: SectionType;

  @Prop({ type: Number, required: true })
  partNumber: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: [Number], required: true })
  questionRange: number[]; // [startNumber, endNumber]

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  resources: SectionResources;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const TestSectionSchema = SchemaFactory.createForClass(TestSection);

// Indexes for better query performance
TestSectionSchema.index({ testId: 1, order: 1 });
TestSectionSchema.index({ sectionType: 1 });
TestSectionSchema.index({ deletedAt: 1 });

