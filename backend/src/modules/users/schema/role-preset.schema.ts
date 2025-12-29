import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RolePresetDocument = HydratedDocument<RolePreset>;

@Schema({ timestamps: true })
export class RolePreset {
  @Prop({ type: String, required: true, unique: true, enum: ['administrator', 'editor', 'viewer', 'support'] })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const RolePresetSchema = SchemaFactory.createForClass(RolePreset);

// Index
RolePresetSchema.index({ role: 1 }, { unique: true });

