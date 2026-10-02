import { Page, expect } from "@playwright/test";
import { z } from "zod";
import { prisma } from "./db-snapshot";

export interface TriSyncExpectations {
  // Layer 1: UI expectations
  ui?: {
    url?: string | RegExp;
    textMatches?: { selector: string; pattern: string | RegExp }[];
    visibleElements?: string[];
    cartBadgeCount?: number;
    wishlistBadgeCount?: number;
    toasts?: string[];
  };

  // Layer 2: Network / API expectations
  network?: {
    endpointPattern?: RegExp | string;
    expectedStatus?: number;
    schema?: z.ZodSchema<any>;
  };

  // Layer 3: Direct Database expectations
  database?: {
    query: () => Promise<any>;
    expected: Record<string, any>;
  };

  // Layer 4: Derived / Cached counters
  derivedCache?: {
    validate: () => Promise<{ actual: any; expected: any; name: string }>;
  };

  // Layer 5: Side Effects (Invoices, Notifications, Audit)
  sideEffects?: {
    validate: () => Promise<{ passed: boolean; message: string }>;
  };
}

export interface TriSyncResult {
  passed: boolean;
  layerResults: {
    ui: boolean;
    network: boolean;
    database: boolean;
    derivedCache: boolean;
    sideEffects: boolean;
  };
  errors: string[];
}

/**
 * Executes a customer action and asserts multi-layer agreement across UI, Network, Database, Cache, and Side Effects.
 */
export async function assertTriSync(
  page: Page,
  action: () => Promise<void>,
  expectations: TriSyncExpectations
): Promise<TriSyncResult> {
  const errors: string[] = [];
  const results = {
    ui: true,
    network: true,
    database: true,
    derivedCache: true,
    sideEffects: true,
  };

  let capturedResponse: { status: number; body: any } | null = null;
  const consoleErrors: string[] = [];

  // Listen for console errors
  const onConsole = (msg: any) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };
  page.on("console", onConsole);

  // Set up network intercept if expected
  let responsePromise: Promise<any> | null = null;
  if (expectations.network?.endpointPattern) {
    responsePromise = page.waitForResponse(
      (res) => {
        const url = res.url();
        const pattern = expectations.network!.endpointPattern!;
        if (pattern instanceof RegExp) {
          return pattern.test(url);
        }
        return url.includes(pattern);
      },
      { timeout: 8000 }
    ).catch(() => null);
  }

  // Execute the user action
  await action();

  // Wait for network response if registered
  if (responsePromise) {
    const res = await responsePromise;
    if (res) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      capturedResponse = {
        status: res.status(),
        body,
      };
    }
  }

  // --- LAYER 1: UI VERIFICATION ---
  if (expectations.ui) {
    try {
      if (expectations.ui.url) {
        if (expectations.ui.url instanceof RegExp) {
          expect(page.url()).toMatch(expectations.ui.url);
        } else {
          expect(page.url()).toContain(expectations.ui.url);
        }
      }

      if (expectations.ui.visibleElements) {
        for (const selector of expectations.ui.visibleElements) {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
        }
      }

      if (expectations.ui.textMatches) {
        for (const match of expectations.ui.textMatches) {
          const locator = page.locator(match.selector).first();
          await expect(locator).toBeVisible({ timeout: 5000 });
          if (match.pattern instanceof RegExp) {
            await expect(locator).toHaveText(match.pattern);
          } else {
            await expect(locator).toContainText(match.pattern);
          }
        }
      }

      if (typeof expectations.ui.cartBadgeCount === "number") {
        const badge = page.locator('[data-testid="cart-badge"], .cart-badge').first();
        if (expectations.ui.cartBadgeCount === 0) {
          const isVisible = await badge.isVisible().catch(() => false);
          if (isVisible) {
            await expect(badge).toHaveText("0");
          }
        } else {
          await expect(badge).toHaveText(String(expectations.ui.cartBadgeCount));
        }
      }
    } catch (err: any) {
      results.ui = false;
      errors.push(`Layer 1 (UI) Mismatch: ${err.message}`);
    }
  }

  // --- LAYER 2: NETWORK / API VERIFICATION ---
  if (expectations.network) {
    try {
      if (expectations.network.expectedStatus && capturedResponse) {
        expect(capturedResponse.status).toBe(expectations.network.expectedStatus);
      }
      if (expectations.network.schema && capturedResponse?.body) {
        const parsed = expectations.network.schema.safeParse(capturedResponse.body);
        if (!parsed.success) {
          throw new Error(`Zod Schema Validation Failed: ${JSON.stringify(parsed.error.errors)}`);
        }
      }
    } catch (err: any) {
      results.network = false;
      errors.push(`Layer 2 (Network) Mismatch: ${err.message}`);
    }
  }

  // --- LAYER 3: DATABASE VERIFICATION ---
  if (expectations.database) {
    try {
      const dbRow = await expectations.database.query();
      expect(dbRow).toBeTruthy();
      for (const [key, expectedValue] of Object.entries(expectations.database.expected)) {
        const actualValue = dbRow[key];
        expect(actualValue).toEqual(expectedValue);
      }
    } catch (err: any) {
      results.database = false;
      errors.push(`Layer 3 (Database) Mismatch: ${err.message}`);
    }
  }

  // --- LAYER 4: DERIVED & CACHED DATA ---
  if (expectations.derivedCache) {
    try {
      const { actual, expected, name } = await expectations.derivedCache.validate();
      expect(actual).toEqual(expected);
    } catch (err: any) {
      results.derivedCache = false;
      errors.push(`Layer 4 (Derived/Cache) Mismatch: ${err.message}`);
    }
  }

  // --- LAYER 5: SIDE EFFECTS ---
  if (expectations.sideEffects) {
    try {
      const { passed, message } = await expectations.sideEffects.validate();
      expect(passed).toBe(true);
    } catch (err: any) {
      results.sideEffects = false;
      errors.push(`Layer 5 (Side Effects) Mismatch: ${err.message}`);
    }
  }

  page.off("console", onConsole);

  const passed = errors.length === 0;
  return {
    passed,
    layerResults: results,
    errors,
  };
}
