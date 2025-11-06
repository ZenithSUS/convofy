import mongoose, { Schema, Document } from "mongoose";

export interface UserSession {
  sessionId: string;
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
    ip?: string;
  };
  createdAt: Date;
  lastActive: Date;
  expiresAt: Date;
}

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
    provider: "credentials" | "google" | "github" | "discord";
    providerAccount: string;
    providerAccountId: string;
  }[];
  activeSessions: UserSession[];
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
          enum: ["credentials", "google", "github", "discord"],
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
    activeSessions: [
      {
        sessionId: { type: String, required: true },
        deviceInfo: {
          browser: { type: String },
          os: { type: String },
          device: { type: String },
          ip: { type: String },
        },
        createdAt: { type: Date, required: true },
        lastActive: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
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
