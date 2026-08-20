import { NEURAL_LANGUAGES } from './neural_config';

/** ISO-style codes used in studios + API */
export const NEURAL_LANG_CODES = NEURAL_LANGUAGES.filter(l => l.code !== 'all').map(l => l.code);

const FLAG_BY_CODE = {
  en: '🇬🇧', ach: '🇺🇬', teo: '🇺🇬', fat: '🇬🇭', hau: '🇳🇬', ibo: '🇳🇬', kik: '🇰🇪',
  kin: '🇷🇼', lug: '🇺🇬', lgg: '🇺🇬', luo: '🇰🇪', pcm: '🇳🇬', nyn: '🇺🇬', swa: '🇹🇿',
  twi: '🇬🇭', wol: '🇸🇳', yor: '🇳🇬', fr: '🇫🇷', es: '🇪🇸', pt: '🇵🇹', de: '🇩🇪', ar: '🇸🇦',
  xog: '🇺🇬', laj: '🇺🇬', alz: '🇺🇬', nyo: '🇺🇬', kdj: '🇺🇬', pok: '🇰🇪', lth: '🇺🇬',
};

const REGION_BY_CODE = {
  en: 'Global', fr: 'Europe', es: 'Global', pt: 'Global', de: 'Europe', ar: 'Middle East',
  ach: 'Uganda', teo: 'Uganda', lug: 'Uganda', lgg: 'Uganda', nyn: 'Uganda', luo: 'East Africa',
  swa: 'East Africa', kin: 'Rwanda', hau: 'West Africa', ibo: 'West Africa', yor: 'West Africa',
  wol: 'West Africa', fat: 'West Africa', twi: 'West Africa', kik: 'East Africa', pcm: 'Nigeria',
  xog: 'Uganda', laj: 'Uganda', alz: 'Uganda', nyo: 'Uganda', kdj: 'Uganda', pok: 'East Africa', lth: 'Uganda',
};

/** Global languages supported in translate / transcribe / summarize pipelines */
export const GLOBAL_LANGUAGES = [
  { code: 'en', name: 'English', region: 'Global', tier: 'core' },
  { code: 'fr', name: 'French', region: 'Europe', tier: 'core' },
  { code: 'es', name: 'Spanish', region: 'Global', tier: 'core' },
  { code: 'pt', name: 'Portuguese', region: 'Global', tier: 'core' },
  { code: 'de', name: 'German', region: 'Europe', tier: 'core' },
  { code: 'ar', name: 'Arabic', region: 'Middle East', tier: 'core' },
];

/** Local MT languages (Moko / Azure) beyond neural TTS catalog */
export const LOCAL_MT_LANGUAGES = [
  { code: 'xog', name: 'Lusoga', region: 'Uganda', tier: 'local_mt' },
  { code: 'laj', name: 'Langi', region: 'Uganda', tier: 'local_mt' },
  { code: 'alz', name: 'Alur', region: 'Uganda', tier: 'local_mt' },
  { code: 'nyo', name: 'Runyoro', region: 'Uganda', tier: 'local_mt' },
  { code: 'kdj', name: 'Ngakarimojong', region: 'Uganda', tier: 'local_mt' },
  { code: 'pok', name: 'Pokot', region: 'East Africa', tier: 'local_mt' },
  { code: 'lth', name: 'Ethur', region: 'Uganda', tier: 'local_mt' },
  { code: 'lgg', name: 'Lugbara', region: 'Uganda', tier: 'local_mt' },
];

/** African neural voice languages (from neural_config) */
export const NEURAL_PLATFORM_LANGUAGES = NEURAL_LANG_CODES.map(code => {
  const neural = NEURAL_LANGUAGES.find(l => l.code === code);
  return {
    code,
    name: neural?.name?.split(' / ')[0] || code.toUpperCase(),
    region: REGION_BY_CODE[code] || 'Africa',
    tier: ['lug', 'swa', 'hau', 'yor', 'ibo', 'en', 'pcm'].includes(code) ? 'flagship' : 'neural',
    neuralVoice: true,
  };
});

export const PLATFORM_LANGUAGES = [...GLOBAL_LANGUAGES, ...NEURAL_PLATFORM_LANGUAGES, ...LOCAL_MT_LANGUAGES]
  .filter((lang, i, arr) => arr.findIndex(x => x.code === lang.code) === i)
  .map(lang => ({
    ...lang,
    flag: FLAG_BY_CODE[lang.code] || '🌍',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const ALL_LANG_CODES = PLATFORM_LANGUAGES.map(l => l.code);

/** Studio tools — aligned with Tools Studio sidebar */
export const STUDIO_FEATURES = [
  {
    id: 'translate',
    label: 'Translate',
    path: '/dashboard/translate',
    description: 'Text and document translation across language pairs.',
    langCodes: ALL_LANG_CODES,
    badge: null,
  },
  {
    id: 'transcribe',
    label: 'Voice Recognition',
    path: '/dashboard/transcribe',
    description: 'Upload or record audio; export transcripts in multiple formats.',
    langCodes: ALL_LANG_CODES,
    badge: null,
  },
  {
    id: 'video_transcribe',
    label: 'Video Transcription',
    path: '/dashboard/transcribe',
    description: 'Extract speech from video files and YouTube-style uploads.',
    langCodes: ALL_LANG_CODES,
    badge: null,
  },
  {
    id: 'synthesize',
    label: 'Text to Speech',
    path: '/dashboard/synthesize',
    description: 'Neural voices with native African speaker personas.',
    langCodes: [...NEURAL_LANG_CODES, 'en'],
    badge: null,
  },
  {
    id: 'document_speech',
    label: 'Document Speech',
    path: '/dashboard/synthesize',
    description: 'Turn translated documents into downloadable audio.',
    langCodes: ALL_LANG_CODES,
    badge: null,
  },
  {
    id: 'voice_clone',
    label: 'Voice Cloning',
    path: '/dashboard/voice-clone',
    description: 'Clone a voice from a short reference recording.',
    langCodes: NEURAL_LANG_CODES,
    badge: 'New',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    path: '/dashboard/summarize',
    description: 'Summarize text, documents, audio, and video.',
    langCodes: ALL_LANG_CODES,
    badge: null,
  },
  {
    id: 'dubbing',
    label: 'Video Dubbing',
    path: '/dashboard/dubbing',
    description: 'Replace dialogue with neural dubbing per segment.',
    langCodes: NEURAL_LANG_CODES,
    badge: 'Pro',
  },
  {
    id: 'voiceovers',
    label: 'Voiceovers',
    path: '/dashboard/voiceovers',
    description: 'Narration blocks for video and slideshow projects.',
    langCodes: NEURAL_LANG_CODES,
    badge: 'New',
  },
  {
    id: 'ad_creative',
    label: 'Ad Creative',
    path: '/dashboard/ad-creative',
    description: 'Fashion, app, and product ad templates with voice and language.',
    langCodes: ALL_LANG_CODES,
    badge: 'New',
  },
];

export const COMING_SOON_LANGUAGES = [
  { name: 'Amharic', code: 'am', region: 'Ethiopia' },
  { name: 'Somali', code: 'so', region: 'Horn of Africa' },
  { name: 'Tigrinya', code: 'ti', region: 'Eritrea' },
  { name: 'Oromo', code: 'om', region: 'Ethiopia' },
  { name: 'Zulu', code: 'zu', region: 'Southern Africa' },
  { name: 'Xhosa', code: 'xh', region: 'Southern Africa' },
];

export function getLanguagesForFeature(featureId) {
  const feat = STUDIO_FEATURES.find(f => f.id === featureId);
  if (!feat) return [];
  return PLATFORM_LANGUAGES.filter(l => feat.langCodes.includes(l.code));
}

export function getFeatureSupportForLanguage(langCode) {
  return STUDIO_FEATURES.filter(f => f.langCodes.includes(langCode));
}

export function getLanguageByCode(code) {
  return PLATFORM_LANGUAGES.find(l => l.code === code);
}

export const LANGUAGE_STATS = {
  totalLanguages: PLATFORM_LANGUAGES.length,
  studioFeatures: STUDIO_FEATURES.length,
  neuralVoices: NEURAL_PLATFORM_LANGUAGES.length,
  comingSoon: COMING_SOON_LANGUAGES.length,
};
