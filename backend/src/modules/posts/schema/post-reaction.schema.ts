import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostReactionDocument = HydratedDocument<PostReaction>;

@Schema({ timestamps: true })
export class PostReaction {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  emoji: string;
}

export const PostReactionSchema = SchemaFactory.createForClass(PostReaction);

// Unique index: một user một emoji một lần cho một post
PostReactionSchema.index({ postId: 1, userId: 1, emoji: 1 }, { unique: true });
PostReactionSchema.index({ postId: 1 });
PostReactionSchema.index({ userId: 1 });

