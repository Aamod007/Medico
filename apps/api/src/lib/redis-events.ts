import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
let redisClient: Redis | null = null;

try {
  redisClient = new Redis(redisUrl, { lazyConnect: true });
  redisClient.connect().catch((e) => console.warn("Redis pub error in storefront API:", e.message));
} catch (e: any) {
  console.warn("Could not instantiate storefront Redis:", e.message);
}

export type OrderEventType =
  | "order.created"
  | "payment.captured"
  | "payment.failed"
  | "stock.low";

export async function publishStoreEvent(type: OrderEventType, payload: {
  entityId: string;
  referenceNumber?: string;
  amount?: number;
  customerName?: string;
  pincode?: string;
  message: string;
}) {
  if (!redisClient) return;
  try {
    const message = JSON.stringify({
      type,
      ...payload,
      timestamp: new Date().toISOString(),
    });
    await redisClient.publish("store:orders", message);
    console.log(`📢 Storefront published event to Redis store:orders: ${type}`);
  } catch (err: any) {
    console.warn("Failed to publish to store:orders:", err.message);
  }
}
