import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostLikeDocument = HydratedDocument<PostLike>;

@Schema({ timestamps: true })
export class PostLike {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

// Unique index: một user chỉ like một post một lần
PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostLikeSchema.index({ postId: 1 });
PostLikeSchema.index({ userId: 1 });

