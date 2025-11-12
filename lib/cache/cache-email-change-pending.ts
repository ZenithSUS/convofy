import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 900; // 15 minutes

export interface EmailPendingData {
  token: string;
  newEmail: string;
}

class EmailChangePendingCache {
  private static getCachekey(userId: string): string {
    return `email-change-pending:${userId}`;
  }

  static async set(userId: string, data: EmailPendingData): Promise<void> {
    const key = this.getCachekey(userId);
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  }

  static async get(userId: string): Promise<string | null> {
    const key = this.getCachekey(userId);
    return await redis.get(key);
  }

  static async invalidate(userId: string): Promise<void> {
    const key = this.getCachekey(userId);
    await redis.del(key);
  }
}

export default EmailChangePendingCache;
