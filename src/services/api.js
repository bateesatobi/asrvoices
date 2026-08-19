/**
 * Centralized API Service for African Voices Platform
 * World-class API integration with subscription tracking and error handling
 */

import axios from 'axios';
import { parseError, notifyUser } from '../utils/errors';
import { NEURAL_SPEAKERS } from '../constants/neural_config';

// Base configuration
export const BASE_URL = (
  process.env.REACT_APP_API_URL || 'https://api.phosaico.com'
).replace(/\/$/, '');

/** API-proxied playback for studio videos (fixes R2 missing Content-Type / CORS). */
export const studioPlaybackUrl = (kind, docId) =>
  docId ? `${BASE_URL}/api/studio/${kind}/${docId}/play` : null;
const REQUEST_TIMEOUT = 0; // Disabled timeouts for sync operations
const LONG_REQUEST_TIMEOUT = 0; // Disabled timeouts for long operations

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: LONG_REQUEST_TIMEOUT, // Default to long timeout for workstation stability
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor — add a debug log and only inject user_id if not already present
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    if (userId) {
      config.headers = config.headers || {};
      if (!config.headers['user-id']) {
        config.headers['user-id'] = userId;
      }
      if (config.data instanceof FormData) {
        // Only inject if not already set by the calling function
        if (!config.data.has('user_id')) {
          config.data.append('user_id', userId);
        }
      } else if (config.data && typeof config.data === 'object') {
        if (!config.data.user_id) {
          config.data.user_id = userId;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function enrichAxiosError(error) {
  const parsed = parseError(error);
  error.friendlyMessage = parsed.message;
  error.shouldUpgrade = parsed.shouldUpgrade;
  error.isNetwork = parsed.isNetwork;
  return error;
}

// Response interceptor for error handling and subscription checks
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      notifyUser({
        type: 'error',
        message: 'Processing is taking longer than expected and timed out. Please try again.',
      });
      return Promise.reject(enrichAxiosError(error));
    }

    const enriched = enrichAxiosError(error);

    if (error.response?.status === 402 || error.response?.status === 403) {
      notifyUser({
        type: 'warning',
        message: enriched.friendlyMessage,
      });
      window.dispatchEvent(new CustomEvent('subscription-limit-exceeded', {
        detail: {
          message: enriched.friendlyMessage,
          status: error.response.status,
          endpoint: error.config?.url,
        },
      }));
    }
    return Promise.reject(enriched);
  }
);

/**
 * SUBSCRIPTION & PRICING APIs
 */
export const subscriptionAPI = {
  // Get pricing tiers
  getPricingTiers: async (currency = 'USD') => {
    const response = await apiClient.get('/api/pricing-tiers', {
      params: { currency }
    });
    return response.data;
  },

  // Check usage limits
  checkUsage: async (endpoint) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    if (!userId) throw new Error('User not authenticated');

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('endpoint', endpoint);

    const response = await axios.post(`${BASE_URL}/api/check-usage`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: REQUEST_TIMEOUT,
    });
    return response.data;
  },

  // Get usage stats
  getUsageStats: async (userId) => {
    const response = await apiClient.get(`/api/usage-stats/${userId}`);
    return response.data;
  },

  // Process payment with Stripe — accepts only a Stripe paymentMethodId, never raw card data
  processPayment: async (paymentData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;

    if (!userId) throw new Error('User not authenticated');

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('tier_id', paymentData.tierId);
    formData.append('amount', paymentData.amount);
    formData.append('currency', paymentData.currency || 'USD');
    formData.append('email', paymentData.email || '');

    // For card payments: send only the Stripe-generated paymentMethodId (never raw card details)
    if (paymentData.paymentMethodId) {
      formData.append('payment_method_id', paymentData.paymentMethodId);
    }
    // For mobile money: phone and provider are non-sensitive
    if (paymentData.phoneNumber) formData.append('phone_number', paymentData.phoneNumber);
    if (paymentData.provider) formData.append('provider', paymentData.provider);

    const response = await axios.post(`${BASE_URL}/api/process-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: REQUEST_TIMEOUT,
    });
    return response.data;
  },

  // Create Stripe payment intent
  createPaymentIntent: async (amount, currency = 'USD', metadata = {}) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('amount', amount);
    formData.append('currency', currency);
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await axios.post(`${BASE_URL}/api/create-payment-intent`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId, paymentMethodId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('payment_intent_id', paymentIntentId);
    formData.append('payment_method_id', paymentMethodId);

    try {
      const response = await axios.post(`${BASE_URL}/api/confirm-payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create Stripe checkout session
  createCheckoutSession: async (priceId, userId) => {
    const response = await apiClient.post('/create-checkout-session', {
      price_id: priceId,
      user_id: userId
    });
    return response.data;
  },

  // Subscribe all users to free tier
  subscribeAllUsersFree: async () => {
    const response = await apiClient.post('/api/subscribe-all-users-free');
    return response.data;
  },

  // Sync Firebase users (legacy alias — provisions current user)
  syncFirebaseUsers: async (payload = {}) => {
    const response = await apiClient.post('/api/sync-firebase-users', payload);
    return response.data;
  },

  // Provision account after sign-in (creates Firestore user + starter credits)
  provisionAccount: async ({ id_token, user_id, email, display_name } = {}) => {
    const response = await apiClient.post('/api/auth/provision', {
      id_token,
      user_id,
      email,
      display_name,
    });
    return response.data;
  },

  // --- NEW CREDIT SYSTEM APIs ---

  // Get current credit balance
  getBalance: async (userId) => {
    const response = await apiClient.get(`/api/credits/balance/${userId}`);
    return response.data;
  },

  // Get credit ledger (transaction history) with optional pagination
  getLedger: async (userId, page = 1, limit = 20) => {
    const response = await apiClient.get(`/api/credits/ledger/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get credit consumption analytics
  getAnalytics: async (userId) => {
    const response = await apiClient.get(`/api/credits/analytics/${userId}`);
    return response.data;
  },

  // Estimate cost for a service before execution
  estimateCost: async (service, quantity) => {
    const response = await apiClient.post('/api/credits/estimate', { service, quantity });
    return response.data;
  }
};

/**
 * AUDIO TRANSCRIPTION APIs
 */
export const transcriptionAPI = {
  // Upload audio file for transcription
  uploadAudio: async (audioFile, sourceLang, userId, responseFormat = 'json') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    formData.append('response_format', responseFormat);

    const response = await apiClient.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload recorded audio
  uploadRecordedAudio: async (audioFile, sourceLang, userId, responseFormat = 'json') => {
    const formData = new FormData();
    formData.append('recorded_audio', audioFile);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    formData.append('response_format', responseFormat);

    const response = await apiClient.post('/upload_recorded_audio/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get audio files
  getAudios: async (userId) => {
    const response = await apiClient.post('/get_audios', { user_id: userId });
    return response.data;
  },

  // Get specific audio
  getAudio: async (docId) => {
    const response = await apiClient.post('/get_audio', { doc_id: docId });
    return response.data;
  },

  // Save edited transcript text
  updateTranscript: async (docId, userId, transcript) => {
    const response = await apiClient.post('/update_transcript/', {
      doc_id: docId,
      user_id: userId,
      transcript,
    });
    return response.data;
  },
};

/**
 * VIDEO PROCESSING APIs
 */
export const videoAPI = {
  // Upload video file (for YouTube URLs)
  uploadVideo: async (youtubeUrl, sourceLang, userId, responseFormat = 'json') => {
    const formData = new FormData();
    formData.append('youtube_link', youtubeUrl);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    formData.append('response_format', responseFormat);

    const response = await apiClient.post('/videoUpload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Get video by doc_id (uses /get_audio_data which queries video_store by doc_id)
  getVideo: async (docId) => {
    const response = await apiClient.post('/get_audio_data', { doc_id: docId });
    return response.data;
  },

  // Extract audio from video file
  extractAudioFromVideo: async (videoFile, sourceLang, userId, responseFormat = 'json') => {
    const formData = new FormData();
    formData.append('video_file', videoFile);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    formData.append('response_format', responseFormat);
    formData.append('async_mode', 'true');

    const response = await apiClient.post('/extract_audio_from_video/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT,
    });
    return response.data;
  },

  // Finalize dubbing: synthesised segment payload → server muxes with ffmpeg.
  // Pass options.videoUrl to reuse the video already stored from transcription (faster).
  finalizeDubbing: async (docId, segments, userId, videoFile, options = {}) => {
    const {
      videoDurationMins = 1.0,
      originalVolume = 0.0,
      burnSubtitles = false,
      trimStartMs = 0,
      trimEndMs = 0,
      background = false,
      bgmTrack = null,
      videoUrl = null,
    } = options;

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('doc_id', docId);
    formData.append('segments_json', JSON.stringify(segments));
    formData.append('video_duration_mins', String(videoDurationMins));
    formData.append('original_volume', String(originalVolume));
    formData.append('burn_subtitles', String(burnSubtitles));
    formData.append('trim_start_ms', String(trimStartMs));
    formData.append('trim_end_ms', String(trimEndMs));
    formData.append('background', String(background));
    if (videoUrl) {
      formData.append('video_url', videoUrl);
    } else if (videoFile) {
      formData.append('video_file', videoFile);
    }
    if (bgmTrack) formData.append('bgm_track', bgmTrack);

    const response = await apiClient.post('/finalize_dubbing/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Finalize image slideshow: ordered images + segment scripts → server synthesises audio & compiles 1080p MP4
  finalizeImageSlideshow: async (segments, userId, imageFiles, options = {}) => {
    const { bgmTrack = null, burnSubtitles = false } = options;
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('segments_json', JSON.stringify(segments));
    formData.append('burn_subtitles', String(burnSubtitles));
    if (bgmTrack) formData.append('bgm_track', bgmTrack);
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    const response = await apiClient.post('/finalize_image_slideshow/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  getBgmTracks: async () => {
    const response = await apiClient.get('/api/bgm-tracks');
    return response.data;
  },

  getJobStatus: async (jobId) => {
    const response = await apiClient.get(`/api/jobs/${jobId}`);
    return response.data;
  },

  // Mux rendered narration onto uploaded video (replaces original audio)
  finalizeNarrationVideo: async (docId, userId, videoFile, options = {}) => {
    const { bgmTrack = null, burnSubtitles = false } = options;
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('doc_id', docId);
    formData.append('video_file', videoFile);
    formData.append('burn_subtitles', String(burnSubtitles));
    if (bgmTrack) formData.append('bgm_track', bgmTrack);
    const response = await apiClient.post('/finalize_narration_video/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT,
    });
    const data = response.data;
    if (data.job_id && data.status === 'starting') {
      const job = await pollJobUntilComplete(data.job_id, options);
      return {
        ...data,
        narration_video_url: job.result?.narration_video_url,
        status: 'completed',
      };
    }
    return data;
  },

  listUserJobs: async (userId, limit = 50) => {
    const response = await apiClient.get(`/api/jobs/user/${userId}`, { params: { limit } });
    return response.data;
  },

  listActiveJobs: async (userId, limit = 30) => {
    const response = await apiClient.get(`/api/jobs/user/${userId}`, {
      params: { limit, active_only: true },
    });
    return response.data;
  },
};

/** Poll a background job until completed or failed. */
export const pollJobUntilComplete = async (jobId, options = {}) => {
  const {
    timeoutMs = 30 * 60 * 1000,
    intervalMs = 3000,
    onProgress,
  } = options;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await videoAPI.getJobStatus(jobId);
    if (onProgress) onProgress(job);
    if (job.status === 'completed') return job;
    if (job.status === 'error' || job.status === 'failed') {
      throw new Error(job.error || 'Job failed');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Job timed out');
};

/**
 * TRANSLATION APIs
 */
export const translationAPI = {
  // Translate text
  translateText: async (text, sourceLang, targetLangs, userId) => {
    const formData = new FormData();
    formData.append('doc', text);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);

    // Append each target language individually
    targetLangs.forEach(lang => {
      formData.append('target_langs', lang);
    });

    const response = await apiClient.post('/translate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Translate many segments in one request (dubbing captions)
  translateBatch: async (segments, sourceLang, targetLangs, userId) => {
    const formData = new FormData();
    formData.append('segments_json', JSON.stringify(segments));
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    targetLangs.forEach((lang) => formData.append('target_langs', lang));
    const response = await apiClient.post('/translate/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT,
    });
    return response.data;
  },

  // Translate document
  translateDocument: async (file, sourceLang, targetLangs, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    targetLangs.forEach(lang => formData.append('target_langs', lang));
    formData.append('user_id', userId);

    const response = await apiClient.post('/translate_document/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Get document
  getDocument: async (docId) => {
    const response = await apiClient.post('/get_document', { doc_id: docId });
    return response.data;
  },

  // Get document translations
  getDocumentTranslations: async (userId) => {
    const response = await apiClient.post('/get_doucument_translations', { user_id: userId });
    return response.data;
  },

  // Get translations
  getTranslations: async (userId) => {
    const response = await apiClient.post('/get_translations', { user_id: userId });
    return response.data;
  },

  // Get specific translation
  getTranslation: async (docId) => {
    const response = await apiClient.post('/get_translation', { doc_id: docId });
    return response.data;
  },

  // Export translation to DOCX
  exportToDocx: async (text, filename = 'translation') => {
    const response = await apiClient.post('/export/docx', { text, filename }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export translation to PDF
  exportToPdf: async (text, filename = 'translation') => {
    const response = await apiClient.post('/export/pdf', { text, filename }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get translation progress status
  getTranslationStatus: async (userId) => {
    const response = await apiClient.get(`/translate/status/${userId}`);
    return response.data;
  }
};

/**
 * SUMMARIZATION APIs
 */
export const summarizationAPI = {
  // Summarize text
  summarizeText: async (text, sourceLang, userId, wordCount = null) => {
    const formData = new FormData();
    formData.append('doc', text);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    if (wordCount) formData.append('word_count', wordCount);

    const response = await apiClient.post('/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Summarize audio from video
  summarizeAudioFromVideo: async (videoFile, sourceLang, userId, wordCount = null) => {
    const formData = new FormData();
    formData.append('video_file', videoFile);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    if (wordCount) formData.append('word_count', wordCount);

    const response = await apiClient.post('/summarize_audio_from_video/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Summarize document
  summarizeDocument: async (file, sourceLang, userId, wordCount = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    if (wordCount) formData.append('word_count', wordCount);

    const response = await apiClient.post('/summarize_document/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Summarize upload
  summarizeUpload: async (audioFile, sourceLang, userId, wordCount = null) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);
    if (wordCount) formData.append('word_count', wordCount);

    const response = await apiClient.post('/summarize_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get summaries
  getSummaries: async (userId) => {
    const response = await apiClient.post('/get_summaries', { user_id: userId });
    return response.data;
  },

  // Get specific summary
  getSummary: async (docId) => {
    const response = await apiClient.post('/get_summary', { doc_id: docId });
    return response.data;
  }
};

/**
 * TEXT-TO-SPEECH APIs
 */
export const ttsAPI = {
  // Synthesize text to speech
  synthesizeText: async (text, speakerId, language, userId, bgmTrack = null, options = {}) => {
    const formData = new FormData();
    formData.append('doc', text);
    const speaker = NEURAL_SPEAKERS.find((s) => s.id === speakerId);
    const lang = speaker?.lang || language || 'swa';
    formData.append('source_lang', lang);
    formData.append('speaker_name', speakerId);
    formData.append('target_langs', lang);
    formData.append('text_lang', options.textLang || 'en');
    formData.append('user_id', userId);
    if (bgmTrack) formData.append('bgm_track', bgmTrack);

    const response = await apiClient.post('/vocify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data;
    if (data.job_id && data.status === 'processing') {
      const job = await pollJobUntilComplete(data.job_id, options);
      const translations = job.result?.translations_with_tts;
      const audioUrl =
        job.result?.audio_url ||
        translations?.[language]?.audio_file_path ||
        (translations &&
          Object.values(translations).find((t) => t && t.audio_file_path)?.audio_file_path);
      const dryUrl =
        translations?.[language]?.dry_audio_path ||
        translations?.[language]?.audio_file_path ||
        audioUrl;
      const langEntry = translations?.[language];
      const ttsError =
        langEntry?.error ||
        (translations &&
          Object.values(translations).find((t) => t && t.error)?.error);
      if (ttsError) {
        throw new Error(
          typeof ttsError === 'string'
            ? ttsError.replace(/^TTS failed:\s*/i, '')
            : 'Speech synthesis failed. Try another voice or language.'
        );
      }
      if (!audioUrl && !dryUrl) {
        throw new Error('No audio was generated. Try another voice or language.');
      }
      return {
        doc_id: job.result?.doc_id || data.doc_id,
        audio_file_url: audioUrl,
        dry_audio_url: dryUrl,
        translations,
        status: 'completed',
      };
    }
    return data;
  },

  // Get vocify voices
  getVocifyVoices: async (userId) => {
    const response = await apiClient.post('/get_vocify_voices', { user_id: userId });
    return response.data;
  },

  // Get specific vocify voice
  getVocifyVoice: async (docId) => {
    const response = await apiClient.post('/get_vocify_voice', { doc_id: docId });
    return response.data;
  },

  // Translate document with TTS (Books / Articles)
  translateDocumentWithTTS: async (file, sourceLang, targetLangs, speakerName, userId, bgmTrack = null, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_langs', JSON.stringify(targetLangs));
    formData.append('speaker_name', speakerName);
    formData.append('user_id', userId);
    if (bgmTrack) formData.append('bgm_track', bgmTrack);

    const response = await apiClient.post('/translate_document_with_tts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    const data = response.data;
    if (data.job_id && data.status === 'processing') {
      const job = await pollJobUntilComplete(data.job_id, options);
      const translations = job.result?.translations_with_tts;
      const primaryLang = Array.isArray(targetLangs) ? targetLangs[0] : targetLangs;
      const langEntry = translations?.[primaryLang] || translations?.[sourceLang];
      const ttsError =
        langEntry?.error ||
        (translations &&
          Object.values(translations).find((t) => t && t.error)?.error);
      if (ttsError) {
        throw new Error(
          typeof ttsError === 'string'
            ? ttsError.replace(/^TTS failed:\s*/i, '')
            : 'Speech synthesis failed. Try another voice or language.'
        );
      }
      return {
        doc_id: job.result?.doc_id || data.doc_id,
        translations,
        status: 'completed',
      };
    }
    return data;
  },

  // Get document voice
  getDocumentVoice: async (docId) => {
    const response = await apiClient.post('/get_document_voice', { doc_id: docId });
    return response.data;
  },

  // Get document voices
  getDocumentVoices: async (userId) => {
    const response = await apiClient.post('/get_document_voices', { user_id: userId });
    return response.data;
  },

  // Batch render professional voiceover narration from script blocks
  renderVoiceover: async (blocks, userId, title = 'Untitled Narration', bgmTrack = null, options = {}) => {
    const body = {
      user_id: userId,
      blocks: blocks.map((b) => ({
        text: b.text,
        speaker_id: b.speaker_id || b.voice,
        language: b.language || 'en',
        pitch: typeof b.pitch === 'number' ? b.pitch : 0,
        rate: typeof b.rate === 'number' ? b.rate : 1.0,
      })),
      title: title,
    };
    if (bgmTrack) body.bgm_track = bgmTrack;
    const response = await apiClient.post('/render_voiceover/', body, { timeout: LONG_REQUEST_TIMEOUT });
    const data = response.data;
    if (data.job_id && (data.status === 'starting' || data.status === 'processing')) {
      const job = await pollJobUntilComplete(data.job_id, options);
      return {
        ...(job.result || {}),
        doc_id: job.result?.doc_id || data.doc_id,
        status: 'completed',
      };
    }
    return data;
  }
};

/**
 * SOUNDTRACK / BGM APIs
 */
export const soundtracksAPI = {
  getTracks: async (refresh = false) => {
    const response = await apiClient.get('/api/soundtracks', {
      params: refresh ? { refresh: true } : undefined,
    });
    return response.data;
  },

  getTrack: async (trackId) => {
    const response = await apiClient.get(`/api/soundtracks/${encodeURIComponent(trackId)}`);
    return response.data;
  },

  /** Mix soundtrack onto existing audio/video (no re-TTS). Overwrites stable R2 key. */
  applySoundtrack: async (docId, source, userId, options = {}) => {
    const { bgmTrack = null, bgmVolume = 0.12, lang = null } = options;
    const response = await apiClient.post('/api/apply_soundtrack', {
      user_id: userId,
      doc_id: docId,
      source,
      bgm_track: bgmTrack,
      bgm_volume: bgmVolume,
      lang,
    });
    return response.data;
  },
};

/**
 * SPEAKER PREVIEW APIs (public voice library samples)
 */
export const speakersAPI = {
  getPreviews: async (refresh = false) => {
    const response = await apiClient.get('/api/speakers/previews', {
      params: refresh ? { refresh: true } : undefined,
    });
    return response.data;
  },

  getPreview: async (speakerId) => {
    const response = await apiClient.get(`/api/speakers/previews/${encodeURIComponent(speakerId)}`);
    return response.data;
  },
};

/**
 * VOICE-TO-VOICE APIs
 */
export const voiceToVoiceAPI = {
  // Voice to voice conversion
  voiceToVoice: async (audioFile, sourceLang, targetLangs, userId) => {
    const formData = new FormData();
    formData.append('recorded_audio', audioFile);
    formData.append('source_lang', sourceLang);
    targetLangs.forEach(lang => formData.append('target_langs', lang));
    formData.append('user_id', userId);

    const response = await apiClient.post('/recorded_audio_vv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Recorded audio voice to voice
  recordedAudioVV: async (audioFile, sourceLang, targetLangs, userId) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('source_lang', sourceLang);
    formData.append('target_langs', JSON.stringify(targetLangs));
    formData.append('user_id', userId);

    const response = await apiClient.post('/recorded_audio_vv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get voices
  getVoices: async (userId) => {
    const response = await apiClient.post('/get_voices', { user_id: userId });
    return response.data;
  },

  // Get TTS voice
  getTTSVoice: async (docId) => {
    const response = await apiClient.post('/get_ttsvoice', { doc_id: docId });
    return response.data;
  }
};

/**
 * BLOG APIs
 */
export const blogAPI = {
  // Create blog post
  createBlogPost: async (title, content, userId) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('user_id', userId);

    const response = await apiClient.post('/blog/', formData);
    return response.data;
  },

  // Get article
  getArticle: async (docId) => {
    const response = await apiClient.post('/get_article', { doc_id: docId });
    return response.data;
  },

  // Get articles
  getArticles: async (userId) => {
    const response = await apiClient.post('/get_articles', { user_id: userId });
    return response.data;
  },

  // Delete blog post
  deleteBlogPost: async (docId) => {
    const response = await apiClient.post('/blog/delete', { doc_id: docId });
    return response.data;
  }
};

/**
 * VOICE CLONING APIs (Neural)
 */
export const voiceCloningAPI = {
  cloneVoice: async (formData) => {
    const response = await apiClient.post('/clone_voice/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  }
};

/**
 * DATA RETRIEVAL APIs
 */
export const dataAPI = {
  // Get all audios for user
  getAudios: async (userId) => {
    const response = await apiClient.post('/get_audios', { user_id: userId });
    return response.data;
  },

  // Get specific audio by doc_id
  getAudio: async (docId) => {
    const response = await apiClient.post('/get_audio', { doc_id: docId });
    return response.data;
  },

  // Get audio data by doc_id
  getAudioData: async (docId) => {
    const response = await apiClient.post('/get_audio_data', { doc_id: docId });
    return response.data;
  },

  // Get specific video by doc_id
  getVideo: async (docId) => {
    const response = await apiClient.post('/get_audio_data', { doc_id: docId });
    return response.data;
  },

  // Get all videos for user
  getVideos: async (userId) => {
    const response = await apiClient.post('/get_video', { user_id: userId });
    return response.data;
  },

  // Get all dubbed videos for user
  getDubbedVideos: async (userId) => {
    const response = await apiClient.post('/get_dubbed_videos', { user_id: userId });
    return response.data;
  },

  // Get a single dubbing project by doc id
  getDubbedVideo: async (docId) => {
    const response = await apiClient.get(`/get_dubbed_video/${docId}`);
    return response.data;
  },

  // Get all voiceover renders for user
  getVoiceovers: async (userId) => {
    const response = await apiClient.post('/get_voiceovers', { user_id: userId });
    return response.data;
  },

  // Get a single voiceover project by doc id
  getVoiceover: async (docId) => {
    const response = await apiClient.get(`/get_voiceover/${docId}`);
    return response.data;
  },

  /** Trim remote audio/video and return blob for download. */
  trimMedia: async (mediaUrl, trimStartMs, trimEndMs, userId, mediaType = 'auto') => {
    const formData = new FormData();
    formData.append('media_url', mediaUrl);
    formData.append('trim_start_ms', String(trimStartMs));
    formData.append('trim_end_ms', String(trimEndMs));
    formData.append('user_id', userId || '');
    formData.append('media_type', mediaType);
    const response = await axios.post(`${BASE_URL}/trim_media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: LONG_REQUEST_TIMEOUT,
    });
    return response.data;
  },

  // Get all translations for user (Unified: Text + Documents)
  getTranslations: async (userId) => {
    const response = await apiClient.post('/get_unified_translations', { user_id: userId });
    return response.data;
  },

  // Get specific translation by doc_id (text + document collections)
  getTranslation: async (docId) => {
    const response = await apiClient.post('/get_translation', { doc_id: docId });
    const entries = Array.isArray(response.data?.entries) ? response.data.entries : [];
    if (entries.length > 0) return response.data;
    const docResponse = await apiClient.post('/get_document', { doc_id: docId });
    return docResponse.data;
  },

  // Get document translations for user
  getDocumentTranslations: async (userId) => {
    const response = await apiClient.post('/get_doucument_translations', { user_id: userId });
    return response.data;
  },

  // Get specific document by doc_id
  getDocument: async (docId) => {
    const response = await apiClient.post('/get_document', { doc_id: docId });
    return response.data;
  },

  // Get all summaries for user
  getSummaries: async (userId) => {
    const response = await apiClient.post('/get_summaries', { user_id: userId });
    return response.data;
  },

  // Get specific summary by doc_id
  getSummary: async (docId) => {
    const response = await apiClient.post('/get_summary', { doc_id: docId });
    return response.data;
  },

  // Get all TTS voices for user
  getVocifyVoices: async (userId) => {
    const response = await apiClient.post('/get_vocify_voices', { user_id: userId });
    return response.data;
  },

  // Get specific TTS voice by doc_id
  getVocifyVoice: async (docId) => {
    const response = await apiClient.post('/get_vocify_voice', { doc_id: docId });
    return response.data;
  },

  // Get document voices for user
  getDocumentVoices: async (userId) => {
    const response = await apiClient.post('/get_document_voices', { user_id: userId });
    return response.data;
  },

  // Get specific document voice by doc_id
  getDocumentVoice: async (docId) => {
    const response = await apiClient.post('/get_document_voice', { doc_id: docId });
    return response.data;
  },

  // Get all voice-to-voice translations for user
  getVoices: async (userId) => {
    const response = await apiClient.post('/get_voices', { user_id: userId });
    return response.data;
  },

  // Get specific TTS voice by doc_id
  getTTSVoice: async (docId) => {
    const response = await apiClient.post('/get_ttsvoice', { doc_id: docId });
    return response.data;
  },

  // Get all blog articles
  getArticles: async () => {
    const response = await apiClient.post('/get_articles', { user_id: 'all' });
    return response.data;
  },

  // Get specific article by doc_id
  getArticle: async (docId) => {
    const response = await apiClient.post('/get_article', { doc_id: docId });
    return response.data;
  },

  // Get consolidated user stats for History page
  getUserStats: async (userId) => {
    const response = await apiClient.post('/api/user-stats', { user_id: userId });
    return response.data;
  },

  // Delete a generic record permanently from Firestore
  deleteRecord: async (collection, docId) => {
    const { uid, userId: localId } = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = uid || localId;
    if (!userId) throw new Error('User not authenticated');

    const response = await apiClient.post('/api/delete-record', {
      collection,
      doc_id: docId,
      user_id: userId
    });
    return response.data;
  },

  redoJob: async (collection, docId) => {
    const { uid, userId: localId } = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = uid || localId;
    if (!userId) throw new Error('User not authenticated');

    const response = await apiClient.post('/api/redo-job', {
      collection,
      doc_id: docId,
      user_id: userId,
    });
    return response.data;
  },
};

/**
 * SYSTEM MONITORING APIs
 */
export const systemAPI = {
  // Get subscription monitoring status
  getSubscriptionMonitoringStatus: async () => {
    const response = await apiClient.get('/api/subscription-monitoring-status');
    return response.data;
  },

  // Get performance stats
  getPerformanceStats: async () => {
    const response = await apiClient.get('/api/performance-stats');
    return response.data;
  },

  // Clear cache
  clearCache: async () => {
    const response = await apiClient.post('/api/clear-cache');
    return response.data;
  },

  // Get monitoring status
  getMonitoringStatus: async () => {
    const response = await apiClient.get('/api/monitoring-status');
    return response.data;
  },

  // Health check endpoint
  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Get billing history for user
  getBillingHistory: async (userId) => {
    const response = await apiClient.get(`/api/billing-history/${userId}`);
    return response.data;
  },

  // Get subscription limits for user
  getSubscriptionLimits: async (userId) => {
    const response = await apiClient.get(`/api/subscription-limits/${userId}`);
    return response.data;
  },

  // Batch check subscriptions for multiple users
  batchCheckSubscriptions: async (userIds) => {
    const response = await apiClient.post('/api/batch-check-subscriptions', userIds);
    return response.data;
  },

  // Clear subscription cache
  clearSubscriptionCache: async () => {
    const response = await apiClient.post('/api/clear-subscription-cache');
    return response.data;
  },

  // Subscribe all users to free tier
  subscribeAllUsersToFreeTier: async () => {
    const response = await apiClient.post('/api/subscribe-all-users-free');
    return response.data;
  },

  // Sync Firebase users
  syncFirebaseUsers: async (payload = {}) => {
    const response = await apiClient.post('/api/sync-firebase-users', payload);
    return response.data;
  },

  // Provision account after sign-in (creates Firestore user + starter credits)
  provisionAccount: async ({ id_token, user_id, email, display_name } = {}) => {
    const response = await apiClient.post('/api/auth/provision', {
      id_token,
      user_id,
      email,
      display_name,
    });
    return response.data;
  },

  // Test payment flows
  testPaymentFlows: async () => {
    const response = await apiClient.post('/api/test-payment-flows');
    return response.data;
  },

  // Get subscription lifecycle
  getSubscriptionLifecycle: async (userId) => {
    const response = await apiClient.get(`/api/subscription-lifecycle/${userId}`);
    return response.data;
  }
};

/**
 * AI AGENTS APIs (PhosConversation)
 */
const PHOSCONVERSATION_BASE_URL = process.env.REACT_APP_AGENTS_API_URL || 'https://phosconversation.onrender.com';

// Create separate axios instance for PhosConversation API
const phosConversationClient = axios.create({
  baseURL: PHOSCONVERSATION_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

phosConversationClient.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

export const agentsAPI = {
  // Upload files and create agent
  uploadFiles: async (files, title, description, sourceLang, userId) => {
    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!title || !description || !sourceLang) {
      throw new Error('Title, description, and source language are required');
    }

    const formData = new FormData();
    // Append each file with the key 'files' (backend expects List[UploadFile])
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('title', title);
    formData.append('description', description);
    formData.append('source_lang', sourceLang);
    formData.append('user_id', userId);

    try {
      const response = await phosConversationClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: LONG_REQUEST_TIMEOUT
      });

      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.data?.detail || 'Failed to create agent');
      }
    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        const errorDetail = error.response.data?.detail || error.response.data?.message || 'Failed to create agent';
        throw new Error(errorDetail);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: No response from server. Please check your connection.');
      } else {
        // Something else happened
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  },

  // Start conversation with agent (text to text)
  startConversation: async (agentId, query, targetLang = 'en', userId) => {
    // Use URLSearchParams for form-urlencoded content type
    const params = new URLSearchParams();
    params.append('agent_id', agentId);
    params.append('query', query);
    params.append('target_lang', targetLang);
    // Note: user_id is not required by the endpoint, but we can include it if needed

    const response = await phosConversationClient.post('/agents/conversations', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  // Process voice input and return voice response (voice to voice)
  processVoice: async (audioFile, agentId, targetLang, userId) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('agent_id', agentId);
    formData.append('target_lang', targetLang);
    formData.append('user_id', userId);

    const response = await phosConversationClient.post('/process_voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Process voice input and return text response (voice to text)
  processVoiceText: async (audioFile, agentId, targetLang, userId) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('agent_id', agentId);
    formData.append('target_lang', targetLang);
    formData.append('user_id', userId);

    const response = await phosConversationClient.post('/process_voice_text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Update agent's knowledge base
  updateAgentIndex: async (agentId, files, userId) => {
    const formData = new FormData();
    formData.append('agent_id', agentId);
    formData.append('user_id', userId);
    files.forEach(file => formData.append('files', file));

    const response = await phosConversationClient.post('/agents/update_index', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: LONG_REQUEST_TIMEOUT
    });
    return response.data;
  },

  // Get user agents
  getUserAgents: async (userId) => {
    const formData = new FormData();
    formData.append('user_id', userId);

    const response = await phosConversationClient.post('/user-agents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get agent info
  getAgentInfo: async (agentId, userId) => {
    const formData = new FormData();
    formData.append('agent_id', agentId);
    formData.append('user_id', userId);

    const response = await phosConversationClient.post('/agent-info', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await phosConversationClient.get('/health');
    return response.data;
  }
};

/**
 * UTILITY FUNCTIONS
 */

// Check if user can use endpoint before making request
export const checkUsageBeforeRequest = async (endpoint) => {
  // Global bypass for workstation development
  return { allowed: true, message: 'Subscription check bypassed', limit: 999, current_usage: 0 };
};

// Get user from localStorage
export const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    return { ...user, userId };
  } catch {
    return {};
  }
};

// Handle API errors with subscription awareness (never expose raw status codes)
export const handleAPIError = (error, endpoint) => {
  const parsed = parseError(error);
  if (parsed.shouldUpgrade) {
    return {
      type: 'subscription_limit',
      message: parsed.message,
      endpoint,
      shouldUpgrade: true,
    };
  }

  return {
    type: 'general_error',
    message: parsed.message,
    endpoint,
    shouldUpgrade: false,
  };
};

export { getFriendlyErrorMessage, notifyApiError } from '../utils/errors';

// Export all APIs as a single object
const api = {
  subscription: subscriptionAPI,
  transcription: transcriptionAPI,
  video: videoAPI,
  translation: translationAPI,
  summarization: summarizationAPI,
  tts: ttsAPI,
  voiceToVoice: voiceToVoiceAPI,
  blog: blogAPI,
  system: systemAPI,
  agents: agentsAPI,
  utils: {
    checkUsageBeforeRequest,
    getCurrentUser,
    handleAPIError
  }
};

export default api;
