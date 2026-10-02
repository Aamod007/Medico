import { NextRequest, NextResponse } from "next/server";
import { formatCityName, resolvePincode } from "@/lib/location";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const pin = searchParams.get("pin");

  // 1. Direct PIN code lookup (offline — instant, no external API needed)
  if (pin) {
    const resolved = resolvePincode(pin);
    if (resolved.valid) {
      return NextResponse.json({
        success: true,
        city: resolved.city,
        pincode: pin,
        state: resolved.state,
        source: "pincode",
      });
    }
    return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
  }

  // 2. Reverse Geocode from GPS coordinates via OpenStreetMap Nominatim
  if (lat && lon) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const geoRes = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "PharmicoHealthcareApp/1.0 (support@pharmico.health)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const addr = geoData?.address || {};

        // Indian PIN code is 6 digits
        const detectedPin =
          addr.postcode && /^\d{6}$/.test(addr.postcode) ? addr.postcode : null;

        const detectedCity =
          addr.city ||
          addr.town ||
          addr.city_district ||
          addr.suburb ||
          addr.district ||
          addr.state_district;

        if (detectedPin) {
          const resolved = resolvePincode(detectedPin);
          const city = resolved.valid
            ? resolved.city
            : formatCityName(detectedCity, addr.state);

          if (city && detectedPin) {
            return NextResponse.json({
              success: true,
              city,
              pincode: detectedPin,
              state: addr.state,
              source: "gps",
            });
          }
        }

        // Nominatim returned coords but no postcode — still return the city at least
        if (detectedCity) {
          const city = formatCityName(detectedCity, addr.state);
          if (city) {
            // Use IP lookup to get an approximate PIN for this city
            const ipPin = await fetchIPBasedPin();
            return NextResponse.json({
              success: true,
              city,
              pincode: ipPin.pincode,
              state: addr.state || ipPin.state,
              source: "gps",
            });
          }
        }
      }
    } catch (geoErr) {
      console.warn("GPS reverse geocode failed:", geoErr);
    }
  }

  // 3. IP-based geolocation (primary for desktop users without GPS)
  const forwarded = req.headers.get("x-forwarded-for");
  const cfIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const rawClientIp = (cfIp || (forwarded ? forwarded.split(",")[0].trim() : realIp) || "").trim();
  const isPrivate =
    !rawClientIp ||
    rawClientIp === "127.0.0.1" ||
    rawClientIp === "::1" ||
    rawClientIp.startsWith("10.") ||
    rawClientIp.startsWith("192.168.") ||
    rawClientIp.startsWith("172.16.");
  const targetIp = isPrivate ? "" : rawClientIp;

  const ipResult = await fetchIPBasedPin(targetIp);
  if (ipResult.city && ipResult.pincode) {
    return NextResponse.json({
      success: true,
      city: ipResult.city,
      pincode: ipResult.pincode,
      state: ipResult.state,
      source: "ip",
    });
  }

  // 4. Nothing worked — tell the user to enter manually, no hardcoded default
  return NextResponse.json({
    success: false,
    city: "",
    pincode: "",
    error: "Location detection failed. Please enter your PIN code or select a city.",
    source: "manual",
  });
}

/**
 * Try multiple IP geolocation services in sequence and return the first valid Indian location.
 */
async function fetchIPBasedPin(targetIp: string = ""): Promise<{
  city: string;
  pincode: string;
  state: string;
}> {
  const empty = { city: "", pincode: "", state: "" };

  // Service 1: ipwho.is (fast, accurate for Indian ISPs)
  try {
    const url = targetIp ? `https://ipwho.is/${encodeURIComponent(targetIp)}` : "https://ipwho.is/";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data.country_code === "IN") {
        const pin =
          data.postal && /^\d{6}$/.test(data.postal) ? data.postal : "";
        const resolved = pin ? resolvePincode(pin) : { valid: false, city: "", state: "" };
        const city = resolved.valid
          ? resolved.city
          : formatCityName(data.city, data.region);
        if (city && pin) {
          return { city, pincode: pin, state: resolved.state || data.region || "" };
        }
        if (city) {
          return { city, pincode: "", state: data.region || "" };
        }
      }
    }
  } catch {
    // try next
  }

  // Service 2: ip-api.com (fallback)
  try {
    const url = targetIp
      ? `http://ip-api.com/json/${encodeURIComponent(targetIp)}?fields=status,country,regionName,city,zip`
      : "http://ip-api.com/json/?fields=status,country,regionName,city,zip";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.status === "success" && data.country === "India") {
        const pin = data.zip && /^\d{6}$/.test(data.zip) ? data.zip : "";
        const resolved = pin ? resolvePincode(pin) : { valid: false, city: "", state: "" };
        const city = resolved.valid
          ? resolved.city
          : formatCityName(data.city, data.regionName);
        if (city && pin) {
          return { city, pincode: pin, state: resolved.state || data.regionName || "" };
        }
        if (city) {
          return { city, pincode: "", state: data.regionName || "" };
        }
      }
    }
  } catch {
    // exhausted
  }

  return empty;
}

