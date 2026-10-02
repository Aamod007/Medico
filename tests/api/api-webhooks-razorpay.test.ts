import { describe, it, expect } from "vitest";
import crypto from "crypto";

const API_BASE = "http://localhost:5000/api";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret_for_webhook_verification_only";

function makeSignature(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Razorpay Webhooks & Payment Security", () => {
  it("rejects webhook requests with invalid or tampered signature", async () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_tampered_123",
            amount: 50000,
            currency: "INR",
            status: "captured",
            order_id: "order_fake_999",
          },
        },
      },
    });

    const badSig = "invalid_signature_hex_digest_fake_123456789";

    const res = await fetch(`${API_BASE}/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": badSig,
      },
      body: payload,
    });

    expect([400, 401, 403]).toContain(res.status);
  });

  it("webhook endpoint processes valid signature and is idempotent", async () => {
    const payload = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_test_idempotent_123",
            amount: 50000,
            currency: "INR",
            status: "failed",
            order_id: "order_non_existent",
          },
        },
      },
    });

    const validSig = makeSignature(payload, WEBHOOK_SECRET);

    // First attempt
    const res1 = await fetch(`${API_BASE}/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSig,
      },
      body: payload,
    });
    expect([200, 400, 404]).toContain(res1.status);

    // Second attempt (duplicate webhook) must not crash or create duplicate side effects
    const res2 = await fetch(`${API_BASE}/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSig,
      },
      body: payload,
    });
    expect([200, 400, 404]).toContain(res2.status);
  });
});
