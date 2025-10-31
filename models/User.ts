import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // optional if using OAuth
  avatar?: string;
  status: "online" | "offline";
  lastActive?: Date;
  createdAt: Date;
  isAnonymous?: boolean;
  anonAlias?: string | null;
  anonAvatar?: string | null;
  linkedAccounts: {
    provider: "credentials" | "google" | "github" | "facebook";
    providerAccount: string;
    providerAccountId: string;
  }[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null }, // optional if using OAuth
    avatar: { type: String },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastActive: { type: Date },
    isAnonymous: { type: Boolean, default: false },
    anonAlias: { type: String },
    anonAvatar: { type: String },
    linkedAccounts: [
      {
        provider: {
          type: String,
          enum: ["credentials", "google", "github", "facebook"],
          required: true,
        },
        providerAccount: {
          type: String,
          required: true,
        },
        providerAccountId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

// Provider ID should be unique for each provider (google, github, etc.)
UserSchema.index(
  {
    "linkedAccounts.provider": 1,
    "linkedAccounts.providerAccount": 1,
    "linkedAccounts.providerAccountId": 1,
  },
  { unique: true },
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
