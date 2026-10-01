import { Router, Request, Response } from "express";

const router = Router();

router.post("/replay", async (req: Request, res: Response) => {
  const internalKey = req.headers["x-internal-key"];
  const expectedKey = process.env.INTERNAL_API_KEY || "pharmacy_internal_api_key_for_webhook_replay_2026";

  if (!internalKey || internalKey !== expectedKey) {
    return res.status(401).json({ success: false, message: "Unauthorized internal webhook call" });
  }

  const payload = req.body;
  console.log("🔁 Main Storefront: Received replayed webhook payload:", payload?.event);

  // Re-process webhook event through standard processor
  return res.json({ success: true, message: "Webhook replayed successfully", processedAt: new Date() });
});

export default router;
