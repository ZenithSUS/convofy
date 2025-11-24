import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const anonymousLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "ratelimit:anonymous",
});

export default anonymousLimit;
