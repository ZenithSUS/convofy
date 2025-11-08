import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const roomCreateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // Only 5 rooms per hour
  analytics: true,
  prefix: "ratelimit:room-create",
});

export default roomCreateLimit;
