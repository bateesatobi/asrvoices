/**
 * Ateker speech-to-text catalog (ISO 639-3).
 * Distinct from the translation catalog — STT only supports these 11 languages.
 */

export const ASR_LANGUAGE_CATALOG = {
  Acholi: 'ach',
  Ateso: 'teo',
  English: 'eng',
  Kinyarwanda: 'kin',
  Luganda: 'lug',
  Lugbara: 'lgg',
  Lumasaba: 'myx',
  Lusoga: 'xog',
  Runyankole: 'nyn',
  Rutooro: 'ttj',
  Swahili: 'swa',
};

export const ASR_LANGUAGES = Object.entries(ASR_LANGUAGE_CATALOG)
  .map(([label, value]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const ASR_LANG_CODES = ASR_LANGUAGES.map((lang) => lang.value);

export const DEFAULT_ASR_LANG = 'eng';

const ASR_ALIASES = {
  en: 'eng',
  english: 'eng',
  lg: 'lug',
  luganda: 'lug',
  sw: 'swa',
  swh: 'swa',
  swahili: 'swa',
  kiswahili: 'swa',
  ac: 'ach',
  acholi: 'ach',
  at: 'teo',
  ateso: 'teo',
  rw: 'kin',
  kinyarwanda: 'kin',
  runyankore: 'nyn',
  runyankole: 'nyn',
};

export function toAsrLang(code, fallback = DEFAULT_ASR_LANG) {
  if (!code) return fallback;
  const key = String(code).toLowerCase().trim();
  if (ASR_LANG_CODES.includes(key)) return key;
  return ASR_ALIASES[key] || fallback;
}

export function getAsrLanguageLabel(code) {
  const iso = toAsrLang(code, '');
  const match = ASR_LANGUAGES.find((lang) => lang.value === iso);
  return match?.label || code || '';
}

export function languagesFromAsrApi(payload) {
  const raw = payload?.languages;
  if (!raw || typeof raw !== 'object') return ASR_LANGUAGES;
  return Object.entries(raw)
    .map(([label, value]) => ({ value: String(value), label: String(label) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
