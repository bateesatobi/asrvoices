/**
 * Ateker Voices translation catalog.
 * API language matching uses ISO 639-3 (`iso639_3`). Optional ISO 639-1 aliases
 * are accepted from older clients and remapped before /translate.
 */

const AFRICAN_LANGUAGES = [
  { category: 'African', iso639_1: 'lg', iso639_3: 'lug', name: 'Luganda' },
  { category: 'African', iso639_3: 'ach', name: 'Acholi' },
  { category: 'African', iso639_3: 'nyn', name: 'Runyankole / Rukiga' },
  { category: 'African', iso639_3: 'teo', name: 'Ateso' },
  { category: 'African', iso639_3: 'lgg', name: 'Lugbara' },
  { category: 'African', iso639_1: 'sw', iso639_3: 'swh', name: 'Swahili' },
  { category: 'African', iso639_1: 'yo', iso639_3: 'yor', name: 'Yoruba' },
  { category: 'African', iso639_1: 'ig', iso639_3: 'ibo', name: 'Igbo' },
  { category: 'African', iso639_1: 'ha', iso639_3: 'hau', name: 'Hausa' },
  { category: 'African', iso639_1: 'am', iso639_3: 'amh', name: 'Amharic' },
  { category: 'African', iso639_1: 'om', iso639_3: 'orm', name: 'Oromo' },
  { category: 'African', iso639_1: 'so', iso639_3: 'som', name: 'Somali' },
  { category: 'African', iso639_1: 'rw', iso639_3: 'kin', name: 'Kinyarwanda' },
  { category: 'African', iso639_1: 'ln', iso639_3: 'lin', name: 'Lingala' },
  { category: 'African', iso639_1: 'ki', iso639_3: 'kik', name: 'Kikuyu' },
  { category: 'African', iso639_3: 'kam', name: 'Kamba' },
  { category: 'African', iso639_3: 'luo', name: 'Luo' },
  { category: 'African', iso639_1: 'sn', iso639_3: 'sna', name: 'Shona' },
  { category: 'African', iso639_1: 'zu', iso639_3: 'zul', name: 'Zulu' },
  { category: 'African', iso639_1: 'xh', iso639_3: 'xho', name: 'Xhosa' },
  { category: 'African', iso639_1: 'ti', iso639_3: 'tir', name: 'Tigrinya' },
  { category: 'African', iso639_1: 'tn', iso639_3: 'tsn', name: 'Tswana' },
  { category: 'African', iso639_1: 'wo', iso639_3: 'wol', name: 'Wolof' },
  { category: 'African', iso639_1: 'ee', iso639_3: 'ewe', name: 'Ewe' },
  { category: 'African', iso639_1: 'tw', iso639_3: 'twi', name: 'Akan / Twi' },
  { category: 'African', iso639_1: 'bm', iso639_3: 'bam', name: 'Bambara' },
  { category: 'African', iso639_1: 'af', iso639_3: 'afr', name: 'Afrikaans' },
  { category: 'African', iso639_3: 'bem', name: 'Bemba' },
  { category: 'African', iso639_1: 'sg', iso639_3: 'sag', name: 'Sango' },
  { category: 'African', iso639_1: 'st', iso639_3: 'sot', name: 'Southern Sotho' },
  { category: 'African', iso639_3: 'nso', name: 'Northern Sotho' },
  { category: 'African', iso639_3: 'tum', name: 'Tumbuka' },
  { category: 'African', iso639_1: 'ny', iso639_3: 'nya', name: 'Nyanja / Chewa' },
  { category: 'African', iso639_1: 'rn', iso639_3: 'run', name: 'Rundi (Kirundi)' },
];

const GLOBAL_LANGUAGES = [
  { category: 'Global', iso639_1: 'en', iso639_3: 'eng', name: 'English' },
  { category: 'Global', iso639_1: 'es', iso639_3: 'spa', name: 'Spanish' },
  { category: 'Global', iso639_1: 'fr', iso639_3: 'fra', name: 'French' },
  { category: 'Global', iso639_1: 'de', iso639_3: 'deu', name: 'German' },
  { category: 'Global', iso639_1: 'it', iso639_3: 'ita', name: 'Italian' },
  { category: 'Global', iso639_1: 'pt', iso639_3: 'por', name: 'Portuguese' },
  { category: 'Global', iso639_1: 'ru', iso639_3: 'rus', name: 'Russian' },
  { category: 'Global', iso639_1: 'zh', iso639_3: 'zho', name: 'Chinese (Simplified)' },
  { category: 'Global', iso639_1: 'zh-tw', iso639_3: 'zht', name: 'Chinese (Traditional)' },
  { category: 'Global', iso639_1: 'ja', iso639_3: 'jpn', name: 'Japanese' },
  { category: 'Global', iso639_1: 'ko', iso639_3: 'kor', name: 'Korean' },
  { category: 'Global', iso639_1: 'ar', iso639_3: 'ara', name: 'Arabic (Standard)' },
  { category: 'Global', iso639_1: 'hi', iso639_3: 'hin', name: 'Hindi' },
  { category: 'Global', iso639_1: 'tr', iso639_3: 'tur', name: 'Turkish' },
  { category: 'Global', iso639_1: 'nl', iso639_3: 'nld', name: 'Dutch' },
  { category: 'Global', iso639_1: 'pl', iso639_3: 'pol', name: 'Polish' },
  { category: 'Global', iso639_1: 'sv', iso639_3: 'swe', name: 'Swedish' },
  { category: 'Global', iso639_1: 'uk', iso639_3: 'ukr', name: 'Ukrainian' },
  { category: 'Global', iso639_1: 'vi', iso639_3: 'vie', name: 'Vietnamese' },
  { category: 'Global', iso639_1: 'id', iso639_3: 'ind', name: 'Indonesian' },
  { category: 'Global', iso639_1: 'th', iso639_3: 'tha', name: 'Thai' },
  { category: 'Global', iso639_1: 'el', iso639_3: 'ell', name: 'Greek' },
  { category: 'Global', iso639_1: 'cs', iso639_3: 'ces', name: 'Czech' },
  { category: 'Global', iso639_1: 'he', iso639_3: 'heb', name: 'Hebrew' },
  { category: 'Global', iso639_1: 'da', iso639_3: 'dan', name: 'Danish' },
  { category: 'Global', iso639_1: 'fi', iso639_3: 'fin', name: 'Finnish' },
  { category: 'Global', iso639_1: 'no', iso639_3: 'nob', name: 'Norwegian Bokmål' },
  { category: 'Global', iso639_1: 'hu', iso639_3: 'hun', name: 'Hungarian' },
  { category: 'Global', iso639_1: 'ro', iso639_3: 'ron', name: 'Romanian' },
  { category: 'Global', iso639_1: 'bg', iso639_3: 'bul', name: 'Bulgarian' },
  { category: 'Global', iso639_1: 'ca', iso639_3: 'cat', name: 'Catalan' },
  { category: 'Global', iso639_1: 'hr', iso639_3: 'hrv', name: 'Croatian' },
  { category: 'Global', iso639_1: 'sr', iso639_3: 'srp', name: 'Serbian' },
  { category: 'Global', iso639_1: 'sk', iso639_3: 'slk', name: 'Slovak' },
  { category: 'Global', iso639_1: 'sl', iso639_3: 'slv', name: 'Slovenian' },
  { category: 'Global', iso639_1: 'fa', iso639_3: 'fas', name: 'Persian (Farsi)' },
  { category: 'Global', iso639_1: 'tl', iso639_3: 'tgl', name: 'Tagalog (Filipino)' },
  { category: 'Global', iso639_1: 'ur', iso639_3: 'urd', name: 'Urdu' },
  { category: 'Global', iso639_1: 'bn', iso639_3: 'ben', name: 'Bengali' },
  { category: 'Global', iso639_1: 'ta', iso639_3: 'tam', name: 'Tamil' },
  { category: 'Global', iso639_1: 'ml', iso639_3: 'mal', name: 'Malayalam' },
  { category: 'Global', iso639_1: 'te', iso639_3: 'tel', name: 'Telugu' },
  { category: 'Global', iso639_1: 'mr', iso639_3: 'mar', name: 'Marathi' },
  { category: 'Global', iso639_1: 'gu', iso639_3: 'guj', name: 'Gujarati' },
  { category: 'Global', iso639_1: 'ne', iso639_3: 'npi', name: 'Nepali' },
  { category: 'Global', iso639_1: 'my', iso639_3: 'mya', name: 'Burmese' },
  { category: 'Global', iso639_1: 'km', iso639_3: 'khm', name: 'Khmer' },
  { category: 'Global', iso639_1: 'lo', iso639_3: 'lao', name: 'Lao' },
  { category: 'Global', iso639_1: 'si', iso639_3: 'sin', name: 'Sinhala' },
  { category: 'Global', iso639_1: 'ms', iso639_3: 'msa', name: 'Malay' },
];

/** Extra historical / neural-catalog aliases → ISO 639-3 */
const EXTRA_ALIASES = {
  ac: 'ach',
  at: 'teo',
  swa: 'swh',
  zh_tw: 'zht',
  'zh-hant': 'zht',
  nb: 'nob',
  fil: 'tgl',
  cmn: 'zho',
  nep: 'npi',
};

export const ATEKER_TRANSLATE_URL = 'https://translate.atekervoices.com/translate';

export const TRANSLATE_LANGUAGE_CATALOG = [...AFRICAN_LANGUAGES, ...GLOBAL_LANGUAGES];

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

export const TRANSLATE_LANGUAGES = [
  ...AFRICAN_LANGUAGES.slice().sort(byName),
  ...GLOBAL_LANGUAGES.slice().sort(byName),
].map((lang) => ({
  value: lang.iso639_3,
  label: lang.name,
  group: lang.category,
  iso639_1: lang.iso639_1 || null,
  iso639_3: lang.iso639_3,
}));

const ALIAS_TO_ISO3 = {};
TRANSLATE_LANGUAGE_CATALOG.forEach((lang) => {
  ALIAS_TO_ISO3[lang.iso639_3] = lang.iso639_3;
  if (lang.iso639_1) {
    ALIAS_TO_ISO3[String(lang.iso639_1).toLowerCase()] = lang.iso639_3;
  }
  ALIAS_TO_ISO3[lang.name.toLowerCase()] = lang.iso639_3;
});
Object.assign(ALIAS_TO_ISO3, EXTRA_ALIASES);

export function toIso6393(code) {
  if (!code) return null;
  const key = String(code).trim().toLowerCase();
  return ALIAS_TO_ISO3[key] || (ALIAS_TO_ISO3[key.replace('_', '-')] || null);
}

export function getTranslateLanguage(code) {
  const iso3 = toIso6393(code) || String(code || '').toLowerCase();
  return TRANSLATE_LANGUAGES.find((l) => l.iso639_3 === iso3 || l.value === code) || null;
}

export function getTranslateLanguageLabel(code) {
  return getTranslateLanguage(code)?.label || String(code || '').toUpperCase();
}

export const DEFAULT_SOURCE_LANG = 'eng';
export const DEFAULT_TARGET_LANG = 'lug';
