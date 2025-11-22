import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export const REDIS_KEYS = {
  MATCH_QUEUE: "matchmaking:queue",
  SEARCHING_USERS: "matchmaking:searching",
  USER_STATUS: (userId: string) => `matchmaking:user:${userId}`,
  MATCH_LOCK: (userId: string) => `matchmaking:lock:${userId}`,
  QUEUE_COUNT: "matchmaking:count",
};
