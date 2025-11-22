import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMatchQueue extends Document {
  userId: Types.ObjectId;
  status: "searching" | "matching" | "matched" | "cancelled";
  matchedWith?: Types.ObjectId | null;
  roomId?: Types.ObjectId | null;

  preferences?: {
    interests?: string[];
    language?: string;
  };

  lockedAt?: Date | null;
  createdAt: Date;
  expiresAt: Date;
  lastHeartbeat: Date;
}

const MatchQueueSchema = new Schema<IMatchQueue>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["searching", "matching", "matched", "cancelled"],
      default: "searching",
    },

    matchedWith: { type: Schema.Types.ObjectId, ref: "User", default: null },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },

    lockedAt: { type: Date, default: null }, // used to prevent double matches

    preferences: {
      interests: [{ type: String }],
      language: { type: String },
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes TTL
    },
    lastHeartbeat: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true },
);

// Search efficiently
MatchQueueSchema.index({ status: 1, createdAt: 1 });

// TTL cleanup
MatchQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.MatchQueue ||
  mongoose.model<IMatchQueue>("MatchQueue", MatchQueueSchema);
