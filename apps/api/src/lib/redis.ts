import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

const redisClient = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false
    })
  : null;

if (redisClient) {
  redisClient.on("error", () => {
    // Redis is optional; fail-soft when unavailable.
  });
}

export async function redisGet(key: string) {
  if (!redisClient) {
    return null;
  }
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string) {
  if (!redisClient) {
    return;
  }
  try {
    await redisClient.setex(key, ttlSeconds, value);
  } catch {
    // ignore cache write failure
  }
}

export async function redisDel(key: string) {
  if (!redisClient) {
    return;
  }
  try {
    await redisClient.del(key);
  } catch {
    // ignore cache delete failure
  }
}

export async function redisIncr(key: string) {
  if (!redisClient) {
    return 0;
  }
  try {
    return await redisClient.incr(key);
  } catch {
    return 0;
  }
}

export async function redisExpire(key: string, ttlSeconds: number) {
  if (!redisClient) {
    return;
  }
  try {
    await redisClient.expire(key, ttlSeconds);
  } catch {
    // ignore rate-limit ttl failure
  }
}

export async function closeRedis() {
  if (!redisClient) {
    return;
  }
  try {
    await redisClient.quit();
  } catch {
    // ignore shutdown failure
  }
}
