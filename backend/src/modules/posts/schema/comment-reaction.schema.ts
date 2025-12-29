import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentReactionDocument = HydratedDocument<CommentReaction>;

@Schema({ timestamps: true })
export class CommentReaction {
  @Prop({ type: Types.ObjectId, ref: 'PostComment', required: true })
  commentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  emoji: string;
}

export const CommentReactionSchema = SchemaFactory.createForClass(CommentReaction);

// Unique index: một user một emoji một lần cho một comment
CommentReactionSchema.index({ commentId: 1, userId: 1, emoji: 1 }, { unique: true });
CommentReactionSchema.index({ commentId: 1 });
CommentReactionSchema.index({ userId: 1 });

