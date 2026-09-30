import { validate, getDetails } from "@devzoy/indian-pincode";

export interface LocationResult {
  success: boolean;
  city: string;
  pincode: string;
  state?: string;
  source: "gps" | "ip" | "pincode" | "manual";
  error?: string;
}

/**
 * Format Indian district/state into a clean display city name.
 */
export function formatCityName(district?: string, state?: string): string {
  if (!district && !state) return "";
  const d = (district || "").toUpperCase();

  if (d.includes("BENGALURU") || d.includes("BANGALORE")) return "Bangalore";
  if (d.includes("MUMBAI")) return "Mumbai";
  if (d.includes("DELHI")) return "Delhi NCR";
  if (d.includes("HYDERABAD")) return "Hyderabad";
  if (d.includes("CHENNAI")) return "Chennai";
  if (d.includes("PUNE")) return "Pune";
  if (d.includes("KOLKATA")) return "Kolkata";
  if (d.includes("AHMEDABAD")) return "Ahmedabad";
  if (d.includes("GURGAON") || d.includes("GURUGRAM")) return "Gurgaon";
  if (d.includes("NOIDA")) return "Noida";
  if (d.includes("LUCKNOW")) return "Lucknow";
  if (d.includes("JAIPUR")) return "Jaipur";
  if (d.includes("SURAT")) return "Surat";
  if (d.includes("KOCHI") || d.includes("COCHIN")) return "Kochi";
  if (d.includes("BHOPAL")) return "Bhopal";
  if (d.includes("INDORE")) return "Indore";
  if (d.includes("NAGPUR")) return "Nagpur";
  if (d.includes("PATNA")) return "Patna";
  if (d.includes("CHANDIGARH")) return "Chandigarh";

  const raw = district || state || "";
  return raw
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Validate and resolve any 6-digit Indian PIN code using offline database.
 */
export function resolvePincode(pin: string): {
  valid: boolean;
  city: string;
  state?: string;
  error?: string;
} {
  const cleanPin = pin.trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return { valid: false, city: "", error: "Please enter a valid 6-digit PIN code" };
  }

  const isValid = validate(cleanPin);
  if (!isValid) {
    return { valid: false, city: "", error: "Invalid Indian PIN code. Please verify and try again." };
  }

  const details = getDetails(cleanPin);
  if (details && details.districts && details.districts.length > 0) {
    const formattedCity = formatCityName(details.districts[0], details.state || undefined);
    return {
      valid: true,
      city: formattedCity,
      state: details.state || undefined,
    };
  }

  return { valid: false, city: "", error: "Location not found for this PIN code" };
}

/**
 * Detect user's approximate location.
 * Strategy:
 *   1. Try browser GPS (works on mobile / location-enabled desktop)
 *   2. Fall back to IP-based detection via our server API
 *   3. Return empty result (no hardcoded default) — user must choose manually
 */
export async function detectUserLocation(): Promise<LocationResult> {
  if (typeof window === "undefined") {
    return { success: false, city: "", pincode: "", source: "manual" };
  }

  // 1. Try browser GPS — works on mobile, sometimes on desktop
  if (navigator.geolocation) {
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      });

      if (coords?.latitude && coords?.longitude) {
        const res = await fetch(
          `/api/location/detect?lat=${coords.latitude}&lon=${coords.longitude}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.city && data.pincode) return data;
        }
      }
    } catch {
      // GPS unavailable or denied — fall through to IP
    }
  }

  // 2. IP-based detection — works on desktop without GPS
  try {
    const res = await fetch("/api/location/detect");
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data.city && data.pincode) return data;
    }
  } catch {
    // network error
  }

  // 3. No fallback — let the user pick manually
  return {
    success: false,
    city: "",
    pincode: "",
    source: "manual",
    error: "Could not detect your location. Please enter your PIN code or select a city below.",
  };
}
