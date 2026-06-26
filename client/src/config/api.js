// client/src/config/api.js
// Centralized API base URL from Vite environment variables
// Fallback to https://api.woomegle.com if not defined so it works perfectly in production
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.woomegle.com';

/**
 * Enhanced fetch helper that adds API_URL, logs request/response details,
 * handles network failures gracefully, and validates JSON response content-types.
 */
export async function apiFetch(endpoint, options = {}) {
  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`[API REQUEST] URL: ${fullUrl} | Method: ${options.method || 'GET'}`);
  if (options.body) {
    console.log(`[API REQUEST BODY]`, options.body);
  }

  let res;
  try {
    res = await fetch(fullUrl, options);
  } catch (err) {
    console.error(`[API FETCH FAILED] URL: ${fullUrl} | Error:`, err.message, err.stack);
    // Print the real backend/network error instead of generic "Backend unavailable"
    throw new Error(`Failed to fetch from ${fullUrl}: ${err.message}`);
  }

  console.log(`[API RESPONSE STATUS] URL: ${fullUrl} | Status: ${res.status} ${res.statusText}`);

  const contentType = res.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
    console.log(`[API RESPONSE BODY] URL: ${fullUrl}`, data);
  } else {
    const text = await res.text();
    console.log(`[API RESPONSE BODY (TEXT/HTML)] URL: ${fullUrl}`, text);
    if (!res.ok) {
      throw new Error(`Backend Error (${res.status}): ${text.substring(0, 250)}`);
    }
    return { res, data: { message: text } };
  }

  if (!res.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${res.status}`;
    console.error(`[API BACKEND ERROR]`, errorMessage);
    throw new Error(errorMessage);
  }

  return { res, data };
}
