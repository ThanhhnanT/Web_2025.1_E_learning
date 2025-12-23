import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

export interface AnswerKey {
  questionNumber: number;
  correctAnswer: string[]; // Array to support multiple answers
  alternatives?: string[]; // Alternative acceptable answers
}

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TestSection', required: true })
  sectionId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  partNumber: number;

  @Prop({ type: String, required: true })
  transcriptHtml: string; // HTML transcript from website, keep original structure

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  answerKeys: AnswerKey[]; // List of correct answers by questionNumber

  @Prop({ type: String })
  audioUrl?: string; // Audio link for this part

  @Prop({ type: String })
  sourceUrl?: string; // URL where the transcript was sourced from

  @Prop({ type: Date, default: null })
  deletedAt: Date | null; // Soft delete
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

// Indexes for better query performance
AnswerSchema.index({ testId: 1, sectionId: 1 }, { unique: true });
AnswerSchema.index({ testId: 1, partNumber: 1 });
AnswerSchema.index({ sectionId: 1 });
AnswerSchema.index({ deletedAt: 1 });

