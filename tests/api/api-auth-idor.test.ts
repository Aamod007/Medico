import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:5000/api";
const JWT_SECRET = "super-secure-jwt-access-secret-min-32-chars-for-medico";

function makeToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

describe("Security & IDOR Audit", () => {
  const userAToken = makeToken({ userId: "user_alpha_test_1", email: "alpha@example.com", role: "CUSTOMER" });
  const userBToken = makeToken({ userId: "user_bravo_test_2", email: "bravo@example.com", role: "CUSTOMER" });
  const adminToken = makeToken({ userId: "admin_test_super", email: "admin@pharmico.com", role: "ADMIN" });

  it("Customer cannot access Admin endpoints (403 Forbidden)", async () => {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  it("Unauthenticated request to Admin endpoints is blocked (401 Unauthorized)", async () => {
    const res = await fetch(`${API_BASE}/admin/inventory`);
    expect([401, 403]).toContain(res.status);
  });

  it("User B cannot access User A's order details (IDOR Prevention)", async () => {
    // 1. Get an existing order from admin
    const adminOrdersRes = await fetch(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await adminOrdersRes.json();
    const orderA = json.data?.orders?.[0];

    if (orderA) {
      // User B attempts to access Order A which belongs to another user
      const idorRes = await fetch(`${API_BASE}/orders/${orderA.id}`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      // Should be 403 Forbidden or 404 Not Found to prevent enumeration
      expect([403, 404]).toContain(idorRes.status);
    }
  });

  it("User B cannot access User A's invoice (IDOR Prevention)", async () => {
    const adminOrdersRes = await fetch(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await adminOrdersRes.json();
    const orderA = json.data?.orders?.[0];

    if (orderA) {
      const idorInvoice = await fetch(`${API_BASE}/orders/${orderA.id}/invoice`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      expect([403, 404]).toContain(idorInvoice.status);
    }
  });

  it("User addresses are strictly scoped to the requesting user", async () => {
    const resA = await fetch(`${API_BASE}/users/addresses`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const jsonA = await resA.json();

    const resB = await fetch(`${API_BASE}/users/addresses`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const jsonB = await resB.json();

    const idsA = (jsonA.data || []).map((a: any) => a.id);
    const idsB = (jsonB.data || []).map((b: any) => b.id);

    // No overlap between addresses
    const overlap = idsA.filter((id: string) => idsB.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
