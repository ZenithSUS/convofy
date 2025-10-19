import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter instance
const redis = Redis.fromEnv();

// Limit to 5 requests per 10 seconds per IP
const authLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
});

export default authLimit;
