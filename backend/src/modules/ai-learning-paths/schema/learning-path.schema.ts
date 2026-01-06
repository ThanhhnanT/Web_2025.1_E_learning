import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LearningPathDocument = HydratedDocument<LearningPath>;

// Question embedded document
export class Question {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  question_text: string;

  @Prop({ type: [String] })
  options: string[];

  @Prop({ type: String })
  correct_answer: string;

  @Prop({ type: String })
  level: string;
}

// Day embedded document
export class Day {
  @Prop({ type: Number })
  day: number;

  @Prop({ type: String })
  skill: string;

  @Prop({ type: String })
  subskill: string;

  @Prop({ type: String })
  youtube_links: string;

  @Prop({ type: String })
  theory: string;

  @Prop({ type: [Object] })
  question_review: Question[];
}

@Schema({ timestamps: true, collection: 'Learning_Path' })
export class LearningPath {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  course: string;

  @Prop({ type: [Object] })
  schedule: Day[];

  @Prop({ type: String })
  roadmapId: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Number, default: 1 })
  currentDay: number;

  @Prop({ type: [Number], default: [] })
  completedDays: number[];

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progressPercentage: number;

  @Prop({ type: Number })
  totalDays: number;

  @Prop({ type: Date })
  lastAccessed: Date;
}

export const LearningPathSchema = SchemaFactory.createForClass(LearningPath);

