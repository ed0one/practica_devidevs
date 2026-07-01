import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisRateLimit = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const cache = new Map();

export const readRateLimit = new Ratelimit({
  redis: redisRateLimit,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  ephemeralCache: cache,
  analytics: false,
  prefix: "taskcapture_read",
});

export const writeRateLimit = new Ratelimit({
  redis: redisRateLimit,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  ephemeralCache: cache,
  analytics: false,
  prefix: "taskcapture_write",
});

export const llmRateLimit = new Ratelimit({
  redis: redisRateLimit,
  limiter: Ratelimit.slidingWindow(12, "60 s"),
  ephemeralCache: cache,
  analytics: false,
  prefix: "taskcapture_llm",
});

export function getClientIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
}
