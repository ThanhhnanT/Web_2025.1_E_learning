import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  MATCHING = 'matching',
  TRUE_FALSE_NOTGIVEN = 'true_false_notgiven',
  YES_NO_NOTGIVEN = 'yes_no_notgiven',
  SENTENCE_COMPLETION = 'sentence_completion',
  DIAGRAM_LABELING = 'diagram_labeling',
  TABLE_COMPLETION = 'table_completion',
  SHORT_ANSWER = 'short_answer',
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS = 'multiple_choice_multiple_answers',
}

export interface QuestionOption {
  key: string; // 'A', 'B', 'C', 'D', etc.
  text: string; // Option text
}

export interface CorrectAnswer {
  value: string[]; // Array to support multiple answers like ['A'] or ['fish', 'roof']
  alternatives?: string[]; // Alternative acceptable answers for fill-in-blank
}

export interface Explanation {
  explanationHtml?: string; // HTML explanation
  keywords?: string[]; // Key words that help find the answer
  relatedPassageLocation?: string; // e.g., "paragraph 3", "line 45-47"
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'QuestionGroup', required: true })
  questionGroupId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  questionNumber: number;

  @Prop({ type: String, enum: Object.values(QuestionType), required: true })
  questionType: QuestionType;

  @Prop({ type: String, required: true })
  questionText: string; // Can contain HTML

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  options: QuestionOption[]; // For multiple choice questions

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  correctAnswer: CorrectAnswer;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  explanation: Explanation;

  @Prop({ type: Number, default: 1 })
  points: number; // Usually 1, but some questions may be worth 2 points

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Indexes for better query performance
QuestionSchema.index({ questionGroupId: 1, order: 1 });
QuestionSchema.index({ questionNumber: 1 });
QuestionSchema.index({ questionType: 1 });
QuestionSchema.index({ deletedAt: 1 });

