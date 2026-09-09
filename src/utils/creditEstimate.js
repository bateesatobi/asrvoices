/**
 * Client-side credit estimator — mirrors backend CREDIT_RATES
 * (ASRAPI/utils/credit_manager.py). Used to show an estimate before
 * a job is submitted. The backend remains the source of truth.
 */
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

/** Round like the backend (2 dp). */
export function estimateCredits(service, quantity) {
  const rate = CREDIT_RATES[service] ?? 1.0;
  const cost = rate * (Number(quantity) || 0);
  return Math.round(cost * 100) / 100;
}

/** Human-friendly estimate string, e.g. "~2.40 credits". */
export function formatEstimate(service, quantity, { min = 0 } = {}) {
  const cost = Math.max(estimateCredits(service, quantity), min);
  if (cost <= 0) return null;
  return `~${cost.toFixed(2)} credits`;
}
