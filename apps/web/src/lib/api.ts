const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "/api" : "http://localhost:5000/api");

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Check if the response is actually JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response received:", text.substring(0, 200));
      throw new Error(
        `Server returned non-JSON response (${res.status}). This usually means the API endpoint is not configured correctly.`
      );
    }

    const json = await res.json();
    if (!res.ok) {
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
