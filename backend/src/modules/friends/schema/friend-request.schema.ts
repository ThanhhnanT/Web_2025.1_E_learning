import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, enum: FriendRequestStatus, default: FriendRequestStatus.PENDING })
  status: FriendRequestStatus;

  @Prop({ type: String })
  note?: string; // Optional personal note from sender

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

// Indexes
FriendRequestSchema.index({ senderId: 1, receiverId: 1 });
FriendRequestSchema.index({ receiverId: 1, status: 1 });
FriendRequestSchema.index({ senderId: 1, status: 1 });

