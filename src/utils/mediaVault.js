import { dataAPI } from '../services/api';
import {
  fetchVaultCached, setVaultCacheEntry,
  readVaultCacheSync, VAULT_CACHE_KEYS, invalidateVaultCache,
} from './vaultCache';
import { getTranslateLanguageLabel, toIso6393 } from '../constants/translateLanguages';

export { invalidateVaultCache, VAULT_CACHE_KEYS, readVaultCacheSync };

export const AC = '#E8A020';
export const G = 'linear-gradient(135deg, #E8A020, #C47F10)';

export const GLASS = {
  background: 'rgba(17, 17, 17, 0.025)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(17, 17, 17, 0.07)',
  borderRadius: '20px',
};

export const STEPPER_SX = {
  '& .MuiStepConnector-line': { borderColor: 'rgba(17,17,17,0.1)' },
  '& .MuiStepLabel-label': { fontWeight: 800, fontSize: '1rem', color: 'rgba(17,17,17,0.4)' },
  '& .MuiStepLabel-label.Mui-active': { color: '#111111' },
  '& .MuiStepLabel-label.Mui-completed': { color: '#111111' },
  '& .MuiStepIcon-root': { color: 'rgba(17,17,17,0.1)' },
  '& .MuiStepIcon-root.Mui-active': { color: AC },
  '& .MuiStepIcon-root.Mui-completed': { color: AC },
};

export function getEntryDate(entry) {
  return entry?.date || entry?.Date || entry?.created_at || entry?.timestamp || null;
}

export function formatRelativeDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  if (d.getTime() > Date.now() + 86400000) {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatFullDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function isProcessingStatus(status) {
  const s = (status || 'completed').toLowerCase();
  return s === 'processing' || s === 'pending' || s === 'started' || s === 'partial'
    || s === 'synthesizing' || s === 'mixing' || s === 'rendering' || s === 'uploading';
}

export function getProcessingStartedAt(row) {
  if (!row) return null;
  return row.processing_started_at || row.Date || row.date || row.created_at || null;
}

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', sw: 'Swahili', lg: 'Luganda', am: 'Amharic',
};

export function langLabel(code) {
  if (!code) return '—';
  const iso3 = toIso6393(code);
  if (iso3) return getTranslateLanguageLabel(iso3);
  return LANG_NAMES[code] || String(code).toUpperCase();
}

export function truncateText(text, max = 72) {
  if (!text || typeof text !== 'string') return '—';
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function formatDurationMins(mins) {
  if (mins == null || mins === '' || Number.isNaN(Number(mins))) return null;
  const m = Number(mins);
  if (m < 1 / 60) return '<1 min';
  if (m < 1) return `${Math.round(m * 60)} sec`;
  if (m < 60) return `${m < 10 ? m.toFixed(1) : Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const rm = Math.round(m % 60);
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export function resolveRowTitle(row) {
  if (row?.title?.trim()) return row.title.trim();
  if (row?.fileName?.trim()) return row.fileName.trim();
  if (row?.filename?.trim()) return row.filename.trim();
  if (row?.video_filename?.trim() && row.video_filename !== 'video.mp4') {
    return row.video_filename.trim();
  }
  if (row?.original_text?.trim()) return truncateText(row.original_text, 48);
  if (row?.summary?.trim()) return truncateText(row.summary, 48);
  if (row?.text?.trim()) return truncateText(row.text, 48);
  return 'Untitled';
}

export function getDubbingDisplayTitle(row) {
  const vf = row?.video_filename?.trim();
  if (vf && vf !== 'video.mp4') return vf;
  const n = row?.segments?.length || 0;
  const langs = [...new Set((row?.segments || []).map(s => s?.target_lang).filter(Boolean))];
  if (n > 0) {
    const langHint = langs.length
      ? langs.slice(0, 2).map(langLabel).join(', ') + (langs.length > 2 ? '…' : '')
      : '';
    return `Dubbing · ${n} segment${n !== 1 ? 's' : ''}${langHint ? ` · ${langHint}` : ''}`;
  }
  return 'Dubbed video project';
}

export function getDubbingTargetLangs(row) {
  return [...new Set((row?.segments || []).map(s => s?.target_lang).filter(Boolean))];
}

export function getAssetDownloadUrl(row) {
  if (!row) return null;
  return (
    row.narration_video_url
    || row.slideshow_url
    || row.video_url
    || row.dubbed_video_url
    || row.combined_audio_url
    || row.Url
    || row.url
    || row.audio_url
    || null
  );
}

export function defaultVaultSearch(row, query) {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const hay = [
    resolveRowTitle(row),
    getDubbingDisplayTitle(row),
    row.fileName,
    row.filename,
    row.video_filename,
    row.source_lang,
    row.target_lang,
    row.response_format,
    row.type,
    row.doc_id,
    row.original_text,
    row.summary,
    row.text,
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q);
}

export function getEntryTitle(entry) {
  return resolveRowTitle(entry);
}

/** Source definitions for merge + tabs */
export const VAULT_SOURCES = [
  {
    id: 'translation',
    label: 'Text Translation',
    color: '#E8A020',
    collectionName: 'text_store',
    studioPath: '/dashboard/translate',
    viewPath: id => `/dashboard/ttdata/${id}`,
    fetchFn: id => dataAPI.getTranslations(id),
    searchFields: ['title', 'source_lang', 'target_lang'],
  },
  {
    id: 'tts',
    label: 'Text to Speech',
    color: '#C47F10',
    collectionName: 'vocify',
    studioPath: '/dashboard/synthesize',
    viewPath: id => `/dashboard/tts/${id}`,
    fetchFn: id => dataAPI.getVocifyVoices(id),
    searchFields: ['title', 'original_text', 'source_lang'],
  },
  {
    id: 'document_tts',
    label: 'Document Speech',
    color: '#C47F10',
    collectionName: 'translated_documents_with_tts',
    studioPath: '/dashboard/synthesize',
    viewPath: null,
    fetchFn: id => dataAPI.getDocumentVoices(id),
    searchFields: ['title', 'filename', 'source_lang'],
  },
  {
    id: 'transcription',
    label: 'Voice Recognition',
    color: '#E8A020',
    collectionName: 'audio_store',
    studioPath: '/dashboard/transcribe',
    viewPath: id => `/dashboard/audio/${id}`,
    fetchFn: id => dataAPI.getAudios(id),
    searchFields: ['title'],
  },
  {
    id: 'video',
    label: 'Video Transcription',
    color: '#C47F10',
    collectionName: 'video_store',
    studioPath: '/dashboard/transcribe',
    viewPath: id => `/dashboard/video/${id}`,
    fetchFn: id => dataAPI.getVideos(id),
    searchFields: ['title'],
  },
  {
    id: 'dubbing',
    label: 'Video Dubbing',
    color: '#E8A020',
    collectionName: 'dubbing_store',
    studioPath: '/dashboard/dubbing',
    viewPath: id => `/dashboard/dub/${id}`,
    fetchFn: id => dataAPI.getDubbedVideos(id),
    searchFields: ['video_filename', 'title'],
  },
  {
    id: 'voiceover',
    label: 'Voiceovers',
    color: '#E8A020',
    collectionName: 'voiceover_store',
    studioPath: '/dashboard/voiceovers',
    viewPath: id => `/dashboard/voiceover/${id}`,
    fetchFn: id => dataAPI.getVoiceovers(id),
    searchFields: ['title'],
  },
  {
    id: 'vox',
    label: 'Voice to Voice',
    color: '#E8A020',
    collectionName: 'vvstore',
    studioPath: '/dashboard/voxtrans',
    viewPath: id => `/dashboard/voice/${id}`,
    fetchFn: id => dataAPI.getVoices(id),
    searchFields: ['title', 'source_lang'],
  },
  {
    id: 'summary',
    label: 'Summarization',
    color: '#C47F10',
    collectionName: 'summary',
    studioPath: '/dashboard/summarize',
    viewPath: id => `/dashboard/summarydata/${id}`,
    fetchFn: id => dataAPI.getSummaries(id),
    searchFields: ['title', 'summary', 'text'],
  },
];

export function normalizeVaultEntry(entry, source) {
  const date = getEntryDate(entry);
  return {
    ...entry,
    _vaultType: source.id,
    _vaultLabel: source.label,
    _vaultColor: source.color,
    _collection: entry.collection || source.collectionName,
    _viewPath: source.viewPath?.(entry.doc_id) ?? null,
    _studioPath: source.studioPath,
    _title: source.id === 'dubbing' ? getDubbingDisplayTitle(entry) : getEntryTitle(entry),
    _date: date,
    _status: entry.status || 'completed',
  };
}

async function fetchSourceEntries(userId, source, { force = false } = {}) {
  const cacheKey = VAULT_CACHE_KEYS[source.id] || source.id;
  const { data: res } = await fetchVaultCached(
    userId,
    cacheKey,
    () => source.fetchFn(userId),
    { force }
  );
  const rows = Array.isArray(res?.entries) ? res.entries : [];
  return rows.map(row => normalizeVaultEntry(row, source));
}

export async function fetchAllVaultActivity(userId, { force = false } = {}) {
  const cached = readVaultCacheSync(userId, VAULT_CACHE_KEYS.ALL_ACTIVITY);
  if (!force && cached) return cached;

  const results = await Promise.allSettled(
    VAULT_SOURCES.map(source => fetchSourceEntries(userId, source, { force }))
  );

  const merged = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') merged.push(...r.value);
    else console.warn(`[MediaVault] Failed to load ${VAULT_SOURCES[i].id}`, r.reason);
  });

  merged.sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));
  setVaultCacheEntry(userId, VAULT_CACHE_KEYS.ALL_ACTIVITY, merged);
  return merged;
}

/** Read merged activity from cache only (no network). */
export function readAllVaultActivityCache(userId) {
  return readVaultCacheSync(userId, VAULT_CACHE_KEYS.ALL_ACTIVITY);
}

export function filterVaultEntries(entries, { query = '', status = 'all', type = 'all', dateFrom = '', dateTo = '' } = {}) {
  const q = query.trim().toLowerCase();
  return entries.filter(row => {
    if (type !== 'all' && row._vaultType !== type) return false;
    if (status !== 'all') {
      const proc = isProcessingStatus(row._status);
      if (status === 'processing' && !proc) return false;
      if (status === 'completed' && proc) return false;
      if (status === 'failed' && row._status !== 'failed') return false;
    }
    if (q && !defaultVaultSearch(row, q)) return false;
    if (dateFrom || dateTo) {
      const d = new Date(row._date || 0);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    }
    return true;
  });
}

export function computeVaultMetrics(entries) {
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  let processing = 0;
  let thisWeek = 0;
  const byType = {};

  entries.forEach(e => {
    if (isProcessingStatus(e._status)) processing += 1;
    const t = new Date(e._date || 0).getTime();
    if (!Number.isNaN(t) && t >= weekAgo) thisWeek += 1;
    byType[e._vaultType] = (byType[e._vaultType] || 0) + 1;
  });

  return {
    total: entries.length,
    processing,
    thisWeek,
    byType,
  };
}
