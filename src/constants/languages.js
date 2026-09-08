export {
  TRANSLATE_LANGUAGES,
  TRANSLATE_LANGUAGE_CATALOG,
  toIso6393,
  getTranslateLanguage,
  getTranslateLanguageLabel,
  DEFAULT_SOURCE_LANG,
  DEFAULT_TARGET_LANG,
} from './translateLanguages';

export {
  ASR_LANGUAGES,
  ASR_LANGUAGE_CATALOG,
  ASR_LANG_CODES,
  DEFAULT_ASR_LANG,
  toAsrLang,
  getAsrLanguageLabel,
} from './asrLanguages';

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'lg', label: 'Luganda' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'ac', label: 'Acholi' },
  { value: 'at', label: 'Ateso' },
  { value: 'nyn', label: 'Runyankore' },
  { value: 'lgg', label: 'Lugbara' },
  { value: 'xog', label: 'Lusoga' },
  { value: 'laj', label: 'Langi' },
  { value: 'alz', label: 'Alur' },
  { value: 'nyo', label: 'Runyoro' },
  { value: 'kdj', label: 'Ngakarimojong' },
  { value: 'pok', label: 'Pokot' },
  { value: 'lth', label: 'Ethur' },
  { value: 'fr', label: 'French' },
  { value: 'rw', label: 'Kinyarwanda' },
];
