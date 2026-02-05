import mongoose, { Schema, Document } from "mongoose";
import Message from "./Message";
import Room from "./Room";
import { User } from "@/types/user";

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
  isAvailable: boolean;
  isAnonymous?: boolean;
  preferences: {
    theme: "light" | "dark";
    hideStatus: boolean;
    hideTypingIndicator: boolean;
  };
  anonAlias?: string | null;
  anonAvatar?: string | null;
  linkedAccounts: {
    provider: "credentials" | "google" | "github" | "discord";
    providerAccount: string;
    providerAccountId: string;
  }[];
  activeSessions: UserSession[];
  role: "user" | "anonymous" | "admin";
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null }, // optional if using OAuth
    avatar: { type: String },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastActive: { type: Date },
    isAvailable: { type: Boolean, default: true },
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      hideStatus: { type: Boolean, default: false },
      hideTypingIndicator: { type: Boolean, default: false },
    },
    isAnonymous: { type: Boolean, default: false },
    anonAlias: { type: String },
    anonAvatar: { type: String },
    linkedAccounts: [
      {
        provider: {
          type: String,
          enum: ["credentials", "anonymous", "google", "github", "discord"],
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
    role: {
      type: String,
      enum: ["user", "anonymous", "admin"],
      default: "user",
    },
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
  { unique: true, sparse: true },
);

// Session ID should be unique
UserSchema.index(
  { "activeSessions.sessionId": 1 },
  { unique: true, sparse: true },
);

// Remove session in anonymous mode
UserSchema.index(
  { lastActive: 1 },
  {
    expireAfterSeconds: 7200, // 2 hours after last activity
    partialFilterExpression: { role: "anonymous" },
  },
);

// Cascade delete messages when user is deleted
UserSchema.post("findOneAndDelete", async (doc: User) => {
  if (doc) {
    // Delete all messages sent by this user
    await Message.deleteMany({ sender: doc._id });

    // Find all rooms the user is a member of
    const userRooms = await Room.find({
      members: doc._id,
    });

    for (const room of userRooms) {
      // CASE 1: Private room (1-on-1 chat) - Delete the entire room
      if (room.isPrivate) {
        await Room.deleteOne({ _id: room._id });
        // Also delete all messages in this private room
        await Message.deleteMany({ room: room._id });
        continue;
      }

      // CASE 2: Group room - Remove user from members
      const remainingMembers = room.members.filter(
        (memberId) => memberId.toString() !== doc._id.toString(),
      );

      // If no members left, delete the room
      if (remainingMembers.length === 0) {
        await Room.deleteOne({ _id: room._id });
        await Message.deleteMany({ room: room._id });
        continue;
      }

      // CASE 3: User is the owner - Transfer ownership
      if (room.owner.toString() === doc._id.toString()) {
        // Strategy: Set the creator as new owner, or first remaining member
        const newOwner =
          remainingMembers.find(
            (m) => m.toString() === room.owner.toString(),
          ) || remainingMembers[0];

        await Room.updateOne(
          { _id: room._id },
          {
            $pull: { members: doc._id },
            $set: { owner: newOwner },
          },
        );
      } else {
        // CASE 4: User is not the owner - Just remove from members
        await Room.updateOne(
          { _id: room._id },
          { $pull: { members: doc._id } },
        );
      }
    }
  }
});

UserSchema.post("deleteOne", async function () {
  const userId = this.getFilter()["_id"];
  if (userId) {
    await Message.deleteMany({ sender: userId });

    const userRooms = await Room.find({ members: userId });

    for (const room of userRooms) {
      if (room.isPrivate) {
        await Room.deleteOne({ _id: room._id });
        await Message.deleteMany({ room: room._id });
        continue;
      }

      const remainingMembers = room.members.filter(
        (memberId) => memberId.toString() !== userId.toString(),
      );

      if (remainingMembers.length === 0) {
        await Room.deleteOne({ _id: room._id });
        await Message.deleteMany({ room: room._id });
        continue;
      }

      if (room.owner.toString() === userId.toString()) {
        const newOwner =
          remainingMembers.find(
            (m) => m.toString() === room.owner.toString(),
          ) || remainingMembers[0];

        await Room.updateOne(
          { _id: room._id },
          {
            $pull: { members: userId },
            $set: { owner: newOwner },
          },
        );
      } else {
        await Room.updateOne({ _id: room._id }, { $pull: { members: userId } });
      }
    }
  }
});

UserSchema.post("deleteMany", async function () {
  const filter = this.getFilter();
  const users = await this.model.find(filter).select("_id");
  const userIds = users.map((user) => user._id);

  if (userIds.length > 0) {
    // Delete all messages from these users
    await Message.deleteMany({ sender: { $in: userIds } });

    // Handle rooms for each user
    for (const userId of userIds) {
      const userRooms = await Room.find({ members: userId });

      for (const room of userRooms) {
        if (room.isPrivate) {
          await Room.deleteOne({ _id: room._id });
          await Message.deleteMany({ room: room._id });
          continue;
        }

        const remainingMembers = room.members.filter(
          (memberId) =>
            !userIds.some((uid) => uid.toString() === memberId.toString()),
        );

        if (remainingMembers.length === 0) {
          await Room.deleteOne({ _id: room._id });
          await Message.deleteMany({ room: room._id });
          continue;
        }

        if (userIds.some((uid) => uid.toString() === room.owner.toString())) {
          const newOwner =
            remainingMembers.find(
              (m) => m.toString() === room.owner.toString(),
            ) || remainingMembers[0];

          await Room.updateOne(
            { _id: room._id },
            {
              $pull: { members: { $in: userIds } },
              $set: { owner: newOwner },
            },
          );
        } else {
          await Room.updateOne(
            { _id: room._id },
            { $pull: { members: { $in: userIds } } },
          );
        }
      }
    }
  }
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
