import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendshipDocument = HydratedDocument<Friendship>;

@Schema({ timestamps: true })
export class Friendship {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId2: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  friendsSince: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// Indexes
FriendshipSchema.index({ userId1: 1, userId2: 1 }, { unique: true });
FriendshipSchema.index({ userId1: 1 });
FriendshipSchema.index({ userId2: 1 });

