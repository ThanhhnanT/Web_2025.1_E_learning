import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoadMapDocument = HydratedDocument<RoadMap>;

@Schema({ timestamps: true, collection: 'Road_Map' })
export class RoadMap {
  @Prop({ type: String })
  goal: string;

  @Prop({ type: String, required: false })
  level?: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  estimated_hours: number;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String })
  roadmapId: string;

  @Prop({ type: Object })
  skills: Record<string, string[]>;

  @Prop({ type: String, required: false })
  imageUrl?: string;
}

export const RoadMapSchema = SchemaFactory.createForClass(RoadMap);

