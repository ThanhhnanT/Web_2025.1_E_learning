import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostCommentDocument = HydratedDocument<PostComment>;

@Schema({ timestamps: true, collection: 'postcomments' })
export class PostComment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'PostComment' })
  parentId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  repliesCount: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const PostCommentSchema = SchemaFactory.createForClass(PostComment);

// Indexes
PostCommentSchema.index({ postId: 1 });
PostCommentSchema.index({ parentId: 1 });
PostCommentSchema.index({ createdAt: -1 });
PostCommentSchema.index({ deletedAt: 1 });
PostCommentSchema.index({ postId: 1, deletedAt: 1 });
PostCommentSchema.index({ parentId: 1, deletedAt: 1 });

