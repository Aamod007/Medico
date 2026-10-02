function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    // If running in production (e.g. on Vercel) and envUrl is not an external HTTPS service, use relative /api
    if (!isLocal && (!envUrl || envUrl.includes("localhost"))) {
      return "/api";
    }
  }
  return envUrl || "http://localhost:5000/api";
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const localUserId = localStorage.getItem("medico_user_id");
    if (localUserId) {
      headers["x-user-id"] = localUserId;
    }
  }

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch (networkErr: any) {
      // If fetching from baseUrl failed (e.g. localhost:5000 is unreachable on deployed site)
      // and we are not already using relative /api, attempt relative Next.js route fallback:
      if (baseUrl !== "/api") {
        try {
          const fallbackRes = await fetch(`/api${cleanEndpoint}`, {
            ...options,
            headers,
            credentials: "include",
          });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            return data;
          }
        } catch {
          // fall through to throw original network error
        }
      }
      throw networkErr;
    }

    // Check if the response is actually JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If non-JSON and we can fall back to relative /api:
      if (baseUrl !== "/api") {
        try {
          const fallbackRes = await fetch(`/api${cleanEndpoint}`, {
            ...options,
            headers,
            credentials: "include",
          });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            return data;
          }
        } catch {}
      }
      const text = await res.text();
      let fallbackJson: any = null;
      try {
        fallbackJson = text ? JSON.parse(text) : null;
      } catch {}
      if (fallbackJson && typeof fallbackJson === "object") {
        return fallbackJson;
      }
      console.error("Non-JSON response received:", text.substring(0, 200));
      throw new Error(
        `Server returned non-JSON response (${res.status}).`
      );
    }

    const text = await res.text();
    let json: any = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { success: res.ok, message: text.substring(0, 150) };
      }
    }

    if (!res.ok) {
      // If remote returned not-ok and we have a local Next.js route fallback for catalog:
      if (baseUrl !== "/api" && cleanEndpoint.startsWith("/catalog")) {
        try {
          const fallbackRes = await fetch(`/api${cleanEndpoint}`, {
            ...options,
            headers,
            credentials: "include",
          });
          if (fallbackRes.ok) {
            return await fallbackRes.json();
          }
        } catch {}
      }
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }
    return json;
  } catch (error: any) {
    console.error("API fetch error:", error.message);
    return {
      success: false,
      message: error.message || "Network request failed",
    };
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { method: "GET", ...options }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { method: "DELETE", ...options }),
};
