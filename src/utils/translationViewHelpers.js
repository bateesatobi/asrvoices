/**
 * Normalize translation records from text_store / translated_documents for view UI.
 */

import { langLabel } from './mediaVault';
import { LANGUAGES } from '../constants/languages';
import { getTranslateLanguageLabel, toIso6393 } from '../constants/translateLanguages';

export function extractTranslationText(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.text || item.translation || item.content || '';
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  if (typeof value === 'object') {
    return value.text || value.translation || value.content || '';
  }
  return String(value);
}

function _firstHttpUrl(...candidates) {
  for (const value of candidates) {
    if (typeof value === 'string' && value.startsWith('http')) return value;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string' && first.startsWith('http')) return first;
      if (first?.audio_file_url?.startsWith?.('http')) return first.audio_file_url;
      if (first?.video_file_url?.startsWith?.('http')) return first.video_file_url;
      if (first?.url?.startsWith?.('http')) return first.url;
    }
  }
  return '';
}

/** Resolve a playable audio URL from audio_store or video_store shapes. */
export function resolveMediaAudioUrl(entry) {
  if (!entry) return '';
  return _firstHttpUrl(
    entry.audio_url,
    entry.Url,
    entry.url,
  );
}

/** Resolve a playable video URL from video_store (R2 / YouTube / legacy shapes). */
export function resolveMediaVideoUrl(entry) {
  if (!entry) return '';
  return _firstHttpUrl(
    entry.video_url,
    entry.url,
    entry.Url,
    entry.playback_url,
  );
}

export function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

export function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  if (isYouTubeUrl(url) || /vimeo\.com/i.test(url)) return false;
  return true;
}

/** Plain-text transcript from any field naming convention in Firestore. */
export function resolveOriginalTranscript(entry) {
  if (!entry) return '';
  const direct =
    entry.Original_transcript ||
    entry.original_transcript ||
    entry.OriginalTranscript ||
    entry.original_text ||
    '';
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const segments = entry.timestamped_transcriptions || entry.timestampedTranscriptions;
  if (Array.isArray(segments) && segments.length > 0) {
    return segments
      .map((s) => (typeof s === 'object' && s ? s.text : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (typeof entry.formatted_transcript === 'string' && entry.formatted_transcript.trim()) {
    return entry.formatted_transcript.trim();
  }
  return '';
}

export function isTranscriptionProcessing(entry) {
  const status = String(entry?.status || '').toLowerCase();
  return status === 'processing' || status === 'pending' || status === 'started';
}

/** Human-readable language name for any code stored in Firestore. */
export function getLanguageDisplayName(code) {
  if (!code) return 'Unknown';
  const iso3 = toIso6393(code);
  if (iso3) return getTranslateLanguageLabel(iso3);
  const fromApp = LANGUAGES.find((l) => l.value === code);
  if (fromApp) return fromApp.label;
  return langLabel(code);
}

export function normalizeTranslationEntry(raw) {
  if (!raw) return null;

  const sourceLang = raw.source_lang || raw.sourceLanguage || '—';
  const originalText =
    raw.original_text ||
    raw.Original_transcript ||
    raw.original ||
    raw.source_text ||
    '';

  const rawMap = raw.translations || raw.Translations || {};
  const translations = {};

  Object.entries(rawMap).forEach(([lang, value]) => {
    translations[lang] = extractTranslationText(value);
  });

  if (!Object.keys(translations).length && raw.translated_text) {
    const target =
      raw.target_lang ||
      (Array.isArray(raw.target_langs) ? raw.target_langs[0] : null) ||
      'translation';
    translations[target] = extractTranslationText(raw.translated_text);
  }

  const targetLangs = [];
  if (raw.target_lang) targetLangs.push(raw.target_lang);
  if (Array.isArray(raw.target_langs)) {
    raw.target_langs.forEach((code) => {
      if (code && !targetLangs.includes(code)) targetLangs.push(code);
    });
  }

  const date = raw.date || raw.Date || raw.created_at || null;
  const title = raw.title || raw.job_name || 'Translation';

  return {
    ...raw,
    sourceLang,
    originalText,
    translations,
    targetLangs,
    date,
    title,
  };
}

/**
 * All languages for the view — every key in `translations`, plus declared targets.
 * Sorted: requested targets first, then any extras (e.g. intermediate English).
 */
export function getTranslationLanguageRows(entry) {
  if (!entry) return [];

  const translations = entry.translations || {};
  const targetOrder = entry.targetLangs || [];
  const allCodes = new Set([...Object.keys(translations), ...targetOrder]);

  const sorted = [...allCodes].sort((a, b) => {
    const ai = targetOrder.indexOf(a);
    const bi = targetOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  return sorted.map((code) => {
    const text = translations[code] ?? '';
    return {
      code,
      label: getLanguageDisplayName(code),
      text,
      isEmpty: !text.trim(),
    };
  });
}

export function formatTranslationDate(value) {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}
