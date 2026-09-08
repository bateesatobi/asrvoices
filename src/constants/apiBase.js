/**
 * Production always uses api.phosaico.com.
 * Do not read REACT_APP_API_URL — Render still has the old fq4x value and
 * would bake it into the JS bundle on every rebuild.
 * Optional override: public/runtime-config.js sets window.__AVOICES_API_URL__.
 */
export function resolveApiBaseUrl() {
  const runtime =
    typeof window !== 'undefined'
      ? (window.__AVOICES_API_URL__ || window.AVOICES_API_URL || '')
      : '';
  if (runtime) return String(runtime).replace(/\/$/, '');
  return 'https://api.phosaico.com';
}

export const API_BASE_URL = resolveApiBaseUrl();
