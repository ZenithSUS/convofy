export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}
