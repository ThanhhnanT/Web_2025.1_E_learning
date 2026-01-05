import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentMethodDocument = HydratedDocument<PaymentMethod>;

@Schema({ timestamps: true })
export class PaymentMethod {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['stripe', 'vnpay', 'momo'] })
  gateway: string;

  @Prop({ type: String, required: true, enum: ['card', 'bank_account', 'e_wallet'] })
  methodType: string;

  @Prop({ type: String, required: true })
  gatewayMethodId: string;

  @Prop({ type: String })
  last4: string;

  @Prop({ type: String })
  brand: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Number })
  expiryMonth: number;

  @Prop({ type: Number })
  expiryYear: number;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

// Indexes for fast queries
PaymentMethodSchema.index({ userId: 1 });
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });
PaymentMethodSchema.index({ gatewayMethodId: 1 }, { unique: true });

