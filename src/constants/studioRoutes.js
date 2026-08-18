/** Dashboard routes that use full-height StudioLayout (no Sidenav padding). */
export const STUDIO_ROUTE_SEGMENTS = new Set([
  'synthesize',
  'transcribe',
  'translate',
  'summarize',
  'voice-cloning',
  'video-voiceover',
  'voiceovers',
]);

export const TOP_BAR_HEIGHT = 64;

export function isStudioRoute(pathname = '') {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return STUDIO_ROUTE_SEGMENTS.has(last);
}
