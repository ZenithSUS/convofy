import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const accountDeletionLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "ratelimit:account-deletion",
});

export default accountDeletionLimit;
