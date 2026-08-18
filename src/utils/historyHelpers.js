import {
  VAULT_SOURCES,
  normalizeVaultEntry,
  resolveRowTitle,
  getEntryDate,
  formatRelativeDate,
  langLabel,
  getDubbingDisplayTitle,
  getDubbingTargetLangs,
  truncateText,
} from './mediaVault';

/** Normalize API list responses — backend uses `{ entries: [...] }`. */
export function parseHistoryEntries(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.entries)) return data.entries;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.voices)) return data.voices;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function getVaultSource(sourceId) {
  return VAULT_SOURCES.find((s) => s.id === sourceId) || null;
}

export function normalizeHistoryRows(data, sourceId) {
  const source = getVaultSource(sourceId);
  const rows = parseHistoryEntries(data);
  if (!source) return rows;
  return rows.map((row) => normalizeVaultEntry(row, source));
}

export function getHistoryItemId(item) {
  return item?.doc_id || item?.id || item?._id || null;
}

export function getHistoryViewPath(item, sourceId) {
  const id = getHistoryItemId(item);
  if (!id) return null;
  const source = getVaultSource(sourceId);
  return source?.viewPath?.(id) ?? null;
}

export function getHistoryTitle(item, sourceId) {
  if (item?._title) return item._title;
  if (sourceId === 'dubbing') return getDubbingDisplayTitle(item);
  return resolveRowTitle(item);
}

export function getHistorySubtitle(item, sourceId) {
  const date = formatRelativeDate(getEntryDate(item));
  switch (sourceId) {
    case 'transcription':
    case 'video':
      return [langLabel(item.source_lang), item.response_format?.toUpperCase(), date]
        .filter(Boolean)
        .join(' · ');
    case 'translation':
      return [
        item.source_lang && item.target_lang
          ? `${item.source_lang} → ${item.target_lang}`
          : null,
        truncateText(item.original_text, 40),
        date,
      ]
        .filter(Boolean)
        .join(' · ');
    case 'tts':
    case 'document_tts':
      return [langLabel(item.source_lang), truncateText(item.original_text, 36), date]
        .filter(Boolean)
        .join(' · ');
    case 'summary':
      return [langLabel(item.source_lang), item.type || 'text', date].filter(Boolean).join(' · ');
    case 'dubbing': {
      const langs = getDubbingTargetLangs(item).map(langLabel).join(', ');
      return [langs || null, date].filter(Boolean).join(' · ');
    }
    case 'voiceover':
      return [item.type || 'narration', date].filter(Boolean).join(' · ');
    default:
      return date;
  }
}
