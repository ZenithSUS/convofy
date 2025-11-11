import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 300; // 5 minutes

export interface TokenData {
  userId: string;
  recoveryEmail: string;
  createdAt: string;
}

class EmailRecoveryTokenCache {
  private static getCacheKey(token: string): string {
    return `email-recovery-token:${token}`;
  }

  static async set(token: string, tokenData: TokenData): Promise<void> {
    const key = this.getCacheKey(token);
    await redis.setex(key, CACHE_TTL, JSON.stringify(tokenData));
  }

  static async get(token: string): Promise<TokenData | null> {
    const key = this.getCacheKey(token);
    return await redis.get(key);
  }

  static async invalidate(token: string): Promise<void> {
    const key = this.getCacheKey(token);
    await redis.del(key);
  }

  static async expiration(token: string): Promise<number> {
    const key = this.getCacheKey(token);
    return await redis.ttl(key);
  }
}

export default EmailRecoveryTokenCache;
