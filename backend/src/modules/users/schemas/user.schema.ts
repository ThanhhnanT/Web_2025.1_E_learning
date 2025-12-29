import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  phone: string;


  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  avatar_url: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: String, enum: ['administrator', 'editor', 'viewer', 'support'], default: 'viewer' })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: String })
  lastLoginIp: string;

  @Prop({ type: String })
  lastLoginLocation: string;

  @Prop() 
  codeId: string
  
  @Prop() 
  codeExpired: string

  // Friends list - array of user IDs
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends: Types.ObjectId[];

  // Privacy settings
  @Prop({ type: Boolean, default: true })
  showOverview: boolean; // Allow others to view overview/statistics

  @Prop({ type: Boolean, default: true })
  showBlog: boolean; // Allow others to view blog posts

  @Prop({ type: Boolean, default: true })
  showFriends: boolean; // Allow others to view friends list

}

export const UserSchema = SchemaFactory.createForClass(User);
