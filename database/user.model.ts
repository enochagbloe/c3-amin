import { model, models, Schema, Document, Types  } from "mongoose";

export interface IUser {
  name: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  phone?: string;
  city?: string;
  status?: string;
  role?: string;
  staffId: string;
  image?: string;
  location?: string;
  portfolio?: string;
  reputation?: number;
}

export interface IUserDoc extends IUser, Document {
  _id: Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    bio: { type: String },
    phone: { type: String },
    city: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    role: { type: String, enum: ['admin', 'manager', 'member', 'viewer'], default: 'member' },
    staffId: { type: String, required: true, unique: true },
    image: { type: String },
    location: { type: String },
    portfolio: { type: String },
    reputation: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = models?.User || model<IUser>("User", UserSchema);

export default User;