import Redis from "ioredis";

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

// In-memory fallback if Redis server is not reachable
class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const expiresAt = mode === "EX" && duration ? Date.now() + duration * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }
}

const memoryFallback = new MemoryCache();
let redisClient: Redis | null = null;
let useMemory = false;

try {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Do not hang or keep retrying if not found
    lazyConnect: true,
  });

  redisClient.connect().catch(() => {
    useMemory = true;
    console.log("ℹ️ Redis not reachable, falling back to built-in in-memory cache.");
  });

  redisClient.on("error", () => {
    useMemory = true;
  });
} catch {
  useMemory = true;
}

export const cache: CacheClient = {
  async get(key: string) {
    if (useMemory || !redisClient) return memoryFallback.get(key);
    try {
      return await redisClient.get(key);
    } catch {
      return memoryFallback.get(key);
    }
  },
  async set(key: string, value: string, mode?: string, duration?: number) {
    if (useMemory || !redisClient) return memoryFallback.set(key, value, mode, duration);
    try {
      if (mode === "EX" && duration) {
        return await redisClient.set(key, value, "EX", duration);
      }
      return await redisClient.set(key, value);
    } catch {
      return memoryFallback.set(key, value, mode, duration);
    }
  },
  async del(key: string) {
    if (useMemory || !redisClient) return memoryFallback.del(key);
    try {
      return await redisClient.del(key);
    } catch {
      return memoryFallback.del(key);
    }
  },
  async expire(key: string, seconds: number) {
    if (useMemory || !redisClient) return memoryFallback.expire(key, seconds);
    try {
      return await redisClient.expire(key, seconds);
    } catch {
      return memoryFallback.expire(key, seconds);
    }
  },
};

export default cache;
