import { UserMediaDataStats } from "@/types/user";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 300; // 5 minutes

class UserStatsCache {
  private static getCachekey(userId: string) {
    return `user-stats:${userId}`;
  }

  static async set(userId: string, data: UserMediaDataStats) {
    const key = this.getCachekey(userId);
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  }

  static async get(userId: string) {
    const key = this.getCachekey(userId);
    return await redis.get(key);
  }

  static async invalidate(userId: string) {
    const key = this.getCachekey(userId);
    await redis.del(key);
  }

  static async refresh(
    userId: string,
    fetchFn: () => Promise<UserMediaDataStats>,
  ) {
    await this.invalidate(userId);
    const data = await fetchFn();
    await this.set(userId, data);
    return data;
  }
}

export default UserStatsCache;
