import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const emailRecoveryLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:email-recovery",
});

export default emailRecoveryLimit;
