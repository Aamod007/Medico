import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

/**
 * Initializes the Razorpay instance from environment variables.
 * In production mode, refuses to start if keys are missing or test keys are used.
 */
export function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!key_id || !key_secret) {
      throw new Error("FATAL: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured in production.");
    }
    if (key_id.startsWith("rzp_test_")) {
      throw new Error("FATAL: Production environment detected with Razorpay test keys. Live production keys are required.");
    }
  }

  return new Razorpay({
    key_id: key_id || "rzp_test_placeholder",
    key_secret: key_secret || "placeholder_secret",
  });
}

export const razorpay = getRazorpay();

export default razorpay;
