// client/src/config/api.js
// Centralized API base URL from Vite environment variables
// Fallback to https://api.woomegle.com if not defined so it works perfectly in production
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.woomegle.com';

/**
 * Enhanced fetch helper that adds API_URL, handles network failures gracefully,
 * and validates JSON response content-types.
 * 
 * Replaces direct fetch('/api/...') and res.json() calls with robust error handling.
 */
export async function apiFetch(endpoint, options = {}) {
  let res;
  try {
    // Prefix endpoint with centralized API_URL
    res = await fetch(`${API_URL}${endpoint}`, options);
  } catch (err) {
    // Handle network failures gracefully (Backend unavailable, Server sleeping, Network error, CORS error)
    console.error('Network or CORS error:', err);
    throw new Error('Network error: Backend unavailable, server sleeping (Render), or CORS error.');
  }

  // First check the response content-type before parsing JSON
  const contentType = res.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    // Server returned non-JSON response (e.g. HTML 502 Bad Gateway / sleeping server / Render splash page)
    throw new Error(`Server returned non-JSON response (Backend unavailable or server sleeping): ${text.substring(0, 150)}`);
  }

  // Handle Invalid credentials specifically if 401/403 and no message was provided
  if (!res.ok && (res.status === 401 || res.status === 403)) {
    if (!data.message) {
      data.message = 'Invalid credentials or unauthorized access';
    }
  }

  return { res, data };
}
