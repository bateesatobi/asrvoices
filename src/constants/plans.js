/**
 * Pay-as-you-go credit packs and rate card.
 * Must stay aligned with ASRAPI/utils/credit_manager.py
 */

export const USD_PER_CREDIT = 0.05;

export const CREDIT_RATES = {
  transcription: 1.0,
  audio_transcription: 1.0,
  video_extraction: 1.5,
  text_translation: 0.0005,
  doc_translation: 5.0,
  summarization: 2.0,
  tts: 0.001,
  voice_cloning: 10.0,
  voice_to_voice: 2.0,
  video_dubbing: 8.0,
  voiceover_batch: 0.002,
};

export const CREDIT_PACKS = [
  {
    id: 'starter',
    backendTier: 'starter',
    title: 'Starter',
    monthly: '$5',
    monthlyRaw: 5,
    annual: '$5',
    annualRaw: 5,
    credits: 100,
    popular: false,
    cta: 'Buy 100 credits',
    ctaPath: '/dashboard/subscription',
    description: 'Try the studio — about 100 minutes of audio transcription.',
    features: [
      { label: '100 credits (~$0.05 each)', included: true },
      { label: '~100 min audio transcription', included: true },
      { label: 'TTS, translate, and summarize', included: true },
      { label: 'Credits never expire', included: true },
      { label: 'Refunded if a job fails', included: true },
    ],
  },
  {
    id: 'studio',
    backendTier: 'studio',
    title: 'Studio',
    monthly: '$15',
    monthlyRaw: 15,
    annual: '$15',
    annualRaw: 15,
    credits: 350,
    popular: true,
    cta: 'Buy 350 credits',
    ctaPath: '/dashboard/subscription',
    description: 'Best for weekly sermons, dubbing, and TTS.',
    features: [
      { label: '350 credits (16% bonus)', included: true },
      { label: '~350 min audio or ~40 min dubbing', included: true },
      { label: 'Refunded if a job fails', included: true },
      { label: 'Credits never expire', included: true },
    ],
  },
  {
    id: 'pro',
    backendTier: 'pro',
    title: 'Pro',
    monthly: '$40',
    monthlyRaw: 40,
    annual: '$40',
    annualRaw: 40,
    credits: 1000,
    popular: false,
    cta: 'Buy 1,000 credits',
    ctaPath: '/dashboard/subscription',
    description: 'Production teams running dubbing and voiceover.',
    features: [
      { label: '1,000 credits (25% bonus)', included: true },
      { label: '~1,000 min audio or ~2 hours dubbing', included: true },
      { label: 'Best rate per credit', included: true },
      { label: 'Credits never expire', included: true },
    ],
  },
  {
    id: 'enterprise_plus',
    backendTier: 'Enterprise Plus',
    title: 'Enterprise Plus',
    monthly: 'Custom',
    monthlyRaw: null,
    annual: 'Custom',
    annualRaw: null,
    credits: null,
    popular: false,
    cta: 'Contact Sales',
    ctaPath: 'mailto:phosaico@gmail.com?subject=Enterprise%20credits',
    description: 'Invoice billing, volume rates, and a dedicated wallet.',
    features: [
      { label: 'Custom credit volume', included: true },
      { label: 'Invoice / purchase order', included: true },
      { label: 'Full API access', included: true },
      { label: 'Custom voice models', included: true },
    ],
  },
];

/** @deprecated Use CREDIT_PACKS — kept so existing screens keep rendering. */
export const PLANS = CREDIT_PACKS;

export function catalogPacksToUi(catalog) {
  const packs = catalog?.packs;
  if (!Array.isArray(packs) || !packs.length) {
    return CREDIT_PACKS.filter((p) => p.monthlyRaw);
  }
  return packs.map((p) => ({
    id: p.id,
    backendTier: p.id,
    title: p.name,
    monthly: `$${p.usd}`,
    monthlyRaw: p.usd,
    annual: `$${p.usd}`,
    annualRaw: p.usd,
    credits: p.credits,
    popular: Boolean(p.popular),
    cta: `Buy ${Number(p.credits).toLocaleString()} credits`,
    ctaPath: '/dashboard/subscription',
    description: p.description || '',
    features: (p.features || []).map((label) => (
      typeof label === 'string' ? { label, included: true } : { label: label.label || String(label), included: true }
    )),
  }));
}

export const PLAN_COLORS = {
  Starter: '#64748b',
  Studio: '#e89f28',
  Pro: '#10b981',
  'Enterprise Plus': '#C47F10',
};
