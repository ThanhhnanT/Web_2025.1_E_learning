import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type QuestionGroupDocument = HydratedDocument<QuestionGroup>;

export enum GroupType {
  SHARED_PASSAGE = 'shared_passage',
  SHARED_INSTRUCTION = 'shared_instruction',
  DIAGRAM = 'diagram',
  TABLE = 'table',
  FORM = 'form',
  NOTE_COMPLETION = 'note_completion',
  FLOW_CHART = 'flow_chart',
  MAP = 'map',
  PLAN = 'plan',
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  SHORT_ANSWER = 'short_answer',
}

export interface SharedContent {
  passage?: string; // HTML content for reading passages
  diagram?: string; // Image URL for diagrams
  options?: Array<{ key: string; text: string }>; // Options for matching questions
  contextHtml?: string; // Any additional HTML context
}

@Schema({ timestamps: true })
export class QuestionGroup {
  @Prop({ type: Types.ObjectId, ref: 'TestSection', required: true })
  sectionId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(GroupType), required: true })
  groupType: GroupType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  instructions: string;

  @Prop({ type: [Number], required: true })
  questionRange: number[]; // [startNumber, endNumber]

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  sharedContent: SharedContent;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const QuestionGroupSchema = SchemaFactory.createForClass(QuestionGroup);

// Indexes for better query performance
QuestionGroupSchema.index({ sectionId: 1, order: 1 });
QuestionGroupSchema.index({ groupType: 1 });
QuestionGroupSchema.index({ deletedAt: 1 });

