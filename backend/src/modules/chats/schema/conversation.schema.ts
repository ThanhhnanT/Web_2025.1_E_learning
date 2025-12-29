import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participants: Types.ObjectId[]; // Array of user IDs

  @Prop({ type: String })
  lastMessage?: string;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ deletedAt: 1 });

