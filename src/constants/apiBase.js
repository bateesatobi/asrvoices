/**
 * Resolve the Avoices backend URL.
 * Runtime window.__AVOICES_API_URL__ wins so production can switch hosts
 * without waiting on a stale Render env var baked into the JS bundle.
 */
export function resolveApiBaseUrl() {
  const runtime =
    typeof window !== 'undefined'
      ? (window.__AVOICES_API_URL__ || window.AVOICES_API_URL || '')
      : '';
  return String(
    runtime || process.env.REACT_APP_API_URL || 'https://api.phosaico.com'
  ).replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();
