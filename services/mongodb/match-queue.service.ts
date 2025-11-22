import MatchQueue from "@/models/MatchQueue";
import Room from "@/models/Room";
import { CreateQueue, IMatchQueue } from "@/types/match-queue";
import mongoose from "mongoose";
import { pusherServer } from "@/lib/pusher/pusher-server";

interface MatchQueueEntry extends IMatchQueue {
  _id: string;
}

const matchQueueService = {
  async createMatchQueue(userId: string, data: CreateQueue) {
    return await MatchQueue.create({
      userId,
      ...data,
      status: "searching",
      lockedAt: null,
    });
  },

  async getMatchQueue(userId: string) {
    return await MatchQueue.findOne({ userId });
  },

  async cancelSearch(userId: string) {
    const entry = await MatchQueue.findOneAndDelete({ userId });

    if (entry) {
      await pusherServer.trigger(
        `private-user-${userId}`,
        "search-cancelled",
        {},
      );
    }

    return true;
  },

  async updateMatchQueue(userId: string, data: Partial<IMatchQueue>) {
    return await MatchQueue.findOneAndUpdate({ userId }, data, {
      new: true,
    });
  },

  async updateLastHeartbeat(userId: string) {
    return await MatchQueue.findOneAndUpdate(
      { userId },
      { lastHeartbeat: new Date() },
      { new: true },
    );
  },

  /**
   * Concurrency-safe matching system (replica-safe + local-safe)
   */
  async tryMatchNow(userEntry: {
    userId: string;
    _id: string;
    preferences: string[];
  }) {
    const useTransactions = process.env.NODE_ENV === "production";
    let session: mongoose.ClientSession | null = null;

    if (useTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // Clean stale locks (older than 5 seconds)
      const staleLimit = new Date(Date.now() - 5000);
      await MatchQueue.updateMany(
        {
          status: "matching",
          lockedAt: { $lte: staleLimit },
        },
        {
          $set: {
            status: "searching",
            lockedAt: null,
          },
        },
      );

      // ATOMIC: Lock a partner
      const partner = await MatchQueue.findOneAndUpdate(
        {
          _id: { $ne: userEntry._id },
          status: "searching",
          lockedAt: null,
        },
        {
          $set: { status: "matching", lockedAt: new Date() },
        },
        {
          new: true,
          sort: { createdAt: 1 },
          ...(session && { session }),
        },
      );

      if (!partner) {
        if (session) {
          await session.commitTransaction();
          session.endSession();
        }
        return null;
      }

      // Create chat room
      const [room] = await Room.create(
        [
          {
            users: [userEntry.userId, partner.userId],
            isAnonymous: true,
            owner: userEntry.userId,
            members: [userEntry.userId, partner.userId],
            isPrivate: true,
            isAccepted: true,
            isPending: false,
          },
        ],
        session ? { session } : undefined,
      );

      const roomId = room._id;

      // Update both entries
      await MatchQueue.updateOne(
        { _id: userEntry._id },
        {
          $set: {
            status: "matched",
            matchedWith: partner.userId,
            roomId,
            lockedAt: null,
          },
        },
        session ? { session } : undefined,
      );

      await MatchQueue.updateOne(
        { _id: partner._id },
        {
          $set: {
            status: "matched",
            matchedWith: userEntry.userId,
            roomId,
            lockedAt: null,
          },
        },
        session ? { session } : undefined,
      );

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      // Realtime notify
      await Promise.all([
        pusherServer.trigger(
          `private-user-${String(userEntry.userId)}`,
          "match-found",
          {
            roomId: String(roomId),
            partner: { id: String(partner.userId) },
          },
        ),
        pusherServer.trigger(
          `private-user-${String(partner.userId)}`,
          "match-found",
          {
            roomId: String(roomId),
            partner: { id: String(userEntry.userId) },
          },
        ),
      ]);

      return { roomId, partner: partner.userId };
    } catch (err) {
      console.error("Match transaction failed:", err);

      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return null;
    }
  },

  /**
   * Removes expired or stale entries
   */
  async cleanStaleQueue(maxAgeMinutes: number = 10) {
    try {
      const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

      const removed = await MatchQueue.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { status: "searching", createdAt: { $lt: cutoff } },
          { status: "cancelled" },
          {
            status: "matching",
            lockedAt: { $lt: new Date(Date.now() - 10000) }, // matching older than 10s
          },
        ],
      });

      console.log(`[QUEUE CLEANUP] Removed ${removed.deletedCount} entries`);
      return removed.deletedCount;
    } catch (error) {
      console.error("[QUEUE CLEANUP FAILED]", error);
      return 0;
    }
  },

  startCleanupLoop() {
    console.log("[QUEUE CLEANUP] Worker started");

    this.cleanStaleQueue();
    this.cleanHeartbeatStaleUsers();

    // schedule loops
    setInterval(() => {
      this.cleanHeartbeatStaleUsers();
    }, 10 * 1000); // every 10s

    setInterval(() => {
      this.cleanStaleQueue();
    }, 60 * 1000); // every 60s
  },

  async getQueueStats() {
    const [searching, matched, total] = await Promise.all([
      MatchQueue.countDocuments({ status: "searching" }),
      MatchQueue.countDocuments({ status: "matched" }),
      MatchQueue.countDocuments({}),
    ]);

    return {
      searching,
      matched,
      total,
      timestamp: new Date(),
    };
  },

  async checkMatchStatus(userId: string) {
    const entry = await MatchQueue.findOne({ userId })
      .select("status matchedWith roomId lockedAt lastHeartbeat")
      .lean<MatchQueueEntry>();
    if (!entry) return { status: "not_found", matched: false };

    // auto-unlock stale matching
    if (
      entry.status === "matching" &&
      entry.lockedAt &&
      entry.lockedAt < new Date(Date.now() - 5000)
    ) {
      await MatchQueue.updateOne(
        { userId },
        { $set: { status: "searching", lockedAt: null } },
      );
      return { status: "searching", matched: false };
    }

    if (entry.status === "matched" && entry.roomId) {
      return {
        status: "matched",
        matched: true,
        roomId: entry.roomId,
        partnerId: entry.matchedWith,
      };
    }

    if (entry.status === "cancelled") {
      return { status: "cancelled", matched: false };
    }

    return { status: "searching", matched: false };
  },
  async cleanHeartbeatStaleUsers() {
    const cutoff = new Date(Date.now() - 30000); // 30s
    const removed = await MatchQueue.deleteMany({
      lastHeartbeat: { $lt: cutoff },
      status: { $in: ["searching", "matching"] },
    });

    if (removed.deletedCount > 0) {
      console.log(
        `[HEARTBEAT CLEANUP] Removed ${removed.deletedCount} stale users`,
      );
    }

    return removed.deletedCount;
  },
};

export default matchQueueService;
