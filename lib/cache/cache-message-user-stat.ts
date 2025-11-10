import { UserMessageDataStats } from "@/types/user";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 300; // 5 minutes

class UserMessageCacheStats {
  private static getCacheKey(userId: string) {
    return `user-message-stats:${userId}`;
  }

  static async set(userId: string, data: UserMessageDataStats) {
    const key = this.getCacheKey(userId);
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  }

  static async get(userId: string) {
    const key = this.getCacheKey(userId);
    return await redis.get(key);
  }

  static async invalidate(userId: string) {
    const key = this.getCacheKey(userId);
    await redis.del(key);
  }

  static async refresh(
    userId: string,
    fetchFn: () => Promise<UserMessageDataStats>,
  ) {
    await this.invalidate(userId);
    const data = await fetchFn();
    await this.set(userId, data);
    return data;
  }
}

export default UserMessageCacheStats;
