import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: Number, default: 0 })
  likes: number;

  @Prop({ type: Number, default: 0 })
  commentsCount: number;

  @Prop({ 
    type: String, 
    enum: ['active', 'pending', 'reported', 'archived'], 
    default: 'active' 
  })
  status: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes
PostSchema.index({ userId: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ deletedAt: 1 });
PostSchema.index({ userId: 1, deletedAt: 1 });

