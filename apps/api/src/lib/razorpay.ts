import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

export function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TiWDGQAMVvys6R";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "VfgbqKHkgoWjGyO0jHJSPQwS";
  return new Razorpay({ key_id, key_secret });
}

export const razorpay = getRazorpay();

export default razorpay;
