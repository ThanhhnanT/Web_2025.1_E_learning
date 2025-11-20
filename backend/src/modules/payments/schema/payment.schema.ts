import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true, enum: ['credit_card', 'bank_transfer', 'e_wallet'] })
  paymentMethod: string;

  @Prop({ type: String, required: true, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ type: String, unique: true, required: true })
  transactionId: string;

  @Prop({ type: Date })
  paymentDate: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Thêm indexes để tìm kiếm nhanh hơn
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ userId: 1, courseId: 1 }); // Composite index
PaymentSchema.index({ userId: 1, status: 1 }); // Composite index

