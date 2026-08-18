/**
 * Avoices REST API reference — aligned with ASRAPI/main.py routes.
 * Base URL is resolved at runtime from REACT_APP_API_URL.
 */

export const API_VERSION = '1.0';
export const API_DOCS_TITLE = 'Avoices API';

export function getApiBaseUrl() {
  return (
    process.env.REACT_APP_API_URL
    || 'https://phosai-backend-api-1.onrender.com'
  ).replace(/\/$/, '');
}

/** @typedef {{ name: string, type: string, required?: boolean, description: string }} ApiParam */

/** @typedef {{ id: string, method: string, path: string, summary: string, description?: string, contentType?: string, parameters?: ApiParam[], responseExample?: string, notes?: string[] }} ApiEndpoint */

/** @typedef {{ id: string, title: string, description: string, endpoints: ApiEndpoint[] }} ApiGroup */

/** @type {ApiGroup[]} */
export const API_GROUPS = [
  {
    id: 'translation',
    title: 'Translation',
    description: 'Translate plain text or documents between supported language pairs.',
    endpoints: [
      {
        id: 'translate',
        method: 'POST',
        path: '/translate',
        summary: 'Translate text',
        description: 'Translates input text into one or more target languages. Results are stored in Firestore and returned in the response.',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'Authenticated user identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'ISO-style language code for the source text (e.g. en, lg).' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Target language codes. Send repeated form fields or JSON-encoded array per your client.' },
          { name: 'doc', type: 'string', required: true, description: 'Text body to translate.' },
          { name: 'title', type: 'string', required: false, description: 'Optional display title; auto-generated if omitted.' },
        ],
        responseExample: `{
  "en": { "title": "...", "translations": [...] },
  "doc_id": "uuid"
}`,
      },
      {
        id: 'translate-document',
        method: 'POST',
        path: '/translate_document/',
        summary: 'Translate a document file',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Source language code.' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Target languages.' },
          { name: 'title', type: 'string', required: true, description: 'Document title.' },
          { name: 'file', type: 'file', required: true, description: 'Document file (PDF, DOCX, etc.).' },
        ],
      },
      {
        id: 'translate-stream',
        method: 'GET',
        path: '/translate/stream/{user_id}',
        summary: 'Stream translation progress (SSE)',
        description: 'Server-sent events stream for long-running translation jobs.',
        parameters: [
          { name: 'user_id', type: 'path', required: true, description: 'User identifier in the URL path.' },
        ],
      },
    ],
  },
  {
    id: 'transcription',
    title: 'Transcription',
    description: 'Speech-to-text for uploaded audio, recordings, and video files.',
    endpoints: [
      {
        id: 'upload-audio',
        method: 'POST',
        path: '/upload/',
        summary: 'Transcribe audio or video file',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Language spoken in the media.' },
          { name: 'audio_file', type: 'file', required: true, description: 'Audio or video file.' },
          { name: 'response_format', type: 'string', required: false, description: 'json | text | srt | verbose_json (default: json).' },
          { name: 'background', type: 'boolean', required: false, description: 'If true, returns immediately with status processing.' },
        ],
        responseExample: `{
  "doc_id": "uuid",
  "title": "Generated title",
  "audio_link": "https://..."
}`,
        notes: ['Pass background=true for long files; poll history or wait for email notification.'],
      },
      {
        id: 'upload-recorded',
        method: 'POST',
        path: '/upload_recorded_audio/',
        summary: 'Transcribe recorded audio',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Source language.' },
          { name: 'recorded_audio', type: 'file', required: true, description: 'Recorded audio blob.' },
          { name: 'response_format', type: 'string', required: false, description: 'Output format.' },
          { name: 'background', type: 'boolean', required: false, description: 'Process asynchronously.' },
        ],
      },
      {
        id: 'video-upload',
        method: 'POST',
        path: '/videoUpload/',
        summary: 'Transcribe uploaded video',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Spoken language in the video.' },
          { name: 'youtube_link', type: 'file', required: true, description: 'Video file upload field name used by the API.' },
          { name: 'response_format', type: 'string', required: false, description: 'Transcript format.' },
          { name: 'background', type: 'boolean', required: false, description: 'Async processing flag.' },
        ],
      },
    ],
  },
  {
    id: 'tts',
    title: 'Text to speech',
    description: 'Neural speech synthesis and streaming endpoints.',
    endpoints: [
      {
        id: 'vocify',
        method: 'POST',
        path: '/vocify',
        summary: 'Synthesize speech from text',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Language of the input text.' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Languages to generate audio for.' },
          { name: 'doc', type: 'string', required: true, description: 'Text to speak.' },
          { name: 'title', type: 'string', required: false, description: 'Job title.' },
          { name: 'speaker_name', type: 'string', required: false, description: 'Voice persona from /api/tts/voices.' },
          { name: 'background', type: 'boolean', required: false, description: 'Queue background synthesis.' },
        ],
      },
      {
        id: 'tts-stream',
        method: 'POST',
        path: '/api/tts/stream',
        summary: 'Stream TTS audio (PCM)',
        contentType: 'application/json',
        parameters: [
          { name: 'text', type: 'string', required: true, description: 'Text to synthesize.' },
          { name: 'speaker_name', type: 'string', required: false, description: 'Named speaker from voice catalog.' },
          { name: 'language', type: 'string', required: false, description: 'Language code for voice selection.' },
          { name: 'temperature', type: 'number', required: false, description: 'Generation variability (default 0.1).' },
        ],
        responseExample: 'Binary audio/pcm stream',
      },
      {
        id: 'tts-voices',
        method: 'GET',
        path: '/api/tts/voices',
        summary: 'List available TTS voices',
        parameters: [],
        responseExample: `{
  "pseudo_names": ["..."],
  "language_defaults": { "en": "..." },
  "mapping": { }
}`,
      },
      {
        id: 'tts-clone',
        method: 'POST',
        path: '/api/tts/clone',
        summary: 'Clone voice from reference audio',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'text', type: 'string', required: true, description: 'Text to speak in the cloned voice.' },
          { name: 'reference_audio', type: 'file', required: true, description: 'Clean reference recording.' },
          { name: 'temperature', type: 'number', required: false, description: 'Default 0.7.' },
        ],
        responseExample: 'audio/wav stream',
      },
      {
        id: 'document-tts',
        method: 'POST',
        path: '/translate_document_with_tts/',
        summary: 'Document translation with TTS',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Document language.' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Target languages.' },
          { name: 'file', type: 'file', required: true, description: 'Document file.' },
        ],
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice to voice',
    description: 'Real-time and batch voice translation pipelines.',
    endpoints: [
      {
        id: 'vv-upload',
        method: 'POST',
        path: '/upload_recorded_audio_vv',
        summary: 'Upload audio for voice translation',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Source language.' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Target languages.' },
          { name: 'recorded_audio', type: 'file', required: true, description: 'Audio file.' },
        ],
      },
      {
        id: 'vv-recorded',
        method: 'POST',
        path: '/recorded_audio_vv',
        summary: 'Process voice translation session',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Source language.' },
          { name: 'target_langs', type: 'string[]', required: true, description: 'Target languages.' },
          { name: 'audio_file', type: 'file', required: true, description: 'Audio input.' },
        ],
      },
    ],
  },
  {
    id: 'summarization',
    title: 'Summarization',
    description: 'Condense text, documents, audio, and video into summaries.',
    endpoints: [
      {
        id: 'summarize-text',
        method: 'POST',
        path: '/summarize',
        summary: 'Summarize text',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Language of the source text.' },
          { name: 'doc', type: 'string', required: true, description: 'Text to summarize.' },
          { name: 'word_count', type: 'string', required: false, description: 'Target summary length hint.' },
        ],
        responseExample: `{ "summary": "...", "doc_id": "uuid", "title": "..." }`,
      },
      {
        id: 'summarize-document',
        method: 'POST',
        path: '/summarize_document/',
        summary: 'Summarize a document',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Document language.' },
          { name: 'file', type: 'file', required: true, description: 'Document file.' },
        ],
      },
      {
        id: 'summarize-upload',
        method: 'POST',
        path: '/summarize_upload/',
        summary: 'Summarize uploaded audio',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'source_lang', type: 'string', required: true, description: 'Spoken language.' },
          { name: 'audio_file', type: 'file', required: true, description: 'Audio file.' },
        ],
      },
    ],
  },
  {
    id: 'production',
    title: 'Video dubbing & voiceovers',
    description: 'Post-production endpoints for dubbed video and narration projects.',
    endpoints: [
      {
        id: 'finalize-dubbing',
        method: 'POST',
        path: '/finalize_dubbing/',
        summary: 'Render dubbed video',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'doc_id', type: 'string', required: true, description: 'Source transcription document id.' },
          { name: 'segments_json', type: 'string', required: true, description: 'JSON array of dubbing segments (text, target_lang, timing).' },
          { name: 'video_file', type: 'file', required: true, description: 'Source video file.' },
          { name: 'video_duration_mins', type: 'number', required: false, description: 'Used for credit estimation.' },
          { name: 'background', type: 'boolean', required: false, description: 'Process in background; email on completion.' },
        ],
        responseExample: `{ "doc_id": "uuid", "dubbed_video_url": "https://...", "status": "completed" }`,
      },
      {
        id: 'render-voiceover',
        method: 'POST',
        path: '/render_voiceover/',
        summary: 'Render voiceover blocks',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'title', type: 'string', required: true, description: 'Project title.' },
          { name: 'blocks_json', type: 'string', required: true, description: 'JSON array of narration blocks.' },
        ],
      },
    ],
  },
  {
    id: 'library',
    title: 'Media library',
    description: 'Retrieve and manage stored assets for the authenticated user.',
    endpoints: [
      {
        id: 'get-translations',
        method: 'POST',
        path: '/get_translations',
        summary: 'List text translations',
        contentType: 'application/json',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier (JSON body).' },
        ],
        responseExample: `{ "entries": [ { "doc_id": "...", "title": "...", "date": "..." } ] }`,
      },
      {
        id: 'get-audios',
        method: 'POST',
        path: '/get_audios',
        summary: 'List transcriptions',
        contentType: 'application/json',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
        ],
      },
      {
        id: 'get-videos',
        method: 'POST',
        path: '/get_video',
        summary: 'List video transcriptions',
        contentType: 'application/json',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
        ],
      },
      {
        id: 'get-dubbing',
        method: 'POST',
        path: '/get_dubbed_videos',
        summary: 'List dubbed videos',
        contentType: 'application/json',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
        ],
      },
      {
        id: 'delete-record',
        method: 'POST',
        path: '/api/delete-record',
        summary: 'Delete a library record',
        contentType: 'application/json',
        parameters: [
          { name: 'collection', type: 'string', required: true, description: 'Firestore collection name (e.g. audio_store).' },
          { name: 'doc_id', type: 'string', required: true, description: 'Document id to delete.' },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Credits & account',
    description: 'Billing, usage, and health endpoints.',
    endpoints: [
      {
        id: 'health',
        method: 'GET',
        path: '/health',
        summary: 'API health check',
        parameters: [],
        responseExample: `{ "status": "ok" }`,
      },
      {
        id: 'credits-balance',
        method: 'GET',
        path: '/api/credits/balance/{user_id}',
        summary: 'Get credit balance',
        parameters: [
          { name: 'user_id', type: 'path', required: true, description: 'User id in URL path.' },
        ],
        responseExample: `{ "balance": 225.18 }`,
      },
      {
        id: 'credits-estimate',
        method: 'POST',
        path: '/api/credits/estimate',
        summary: 'Estimate job cost',
        contentType: 'application/json',
        parameters: [
          { name: 'operation', type: 'string', required: true, description: 'Operation key (e.g. transcription, video_dubbing).' },
          { name: 'units', type: 'number', required: false, description: 'Duration or unit count.' },
        ],
      },
      {
        id: 'check-usage',
        method: 'POST',
        path: '/api/check-usage',
        summary: 'Check subscription / usage limits',
        contentType: 'multipart/form-data',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User identifier.' },
          { name: 'endpoint', type: 'string', required: true, description: 'Endpoint name to check against plan limits.' },
        ],
      },
    ],
  },
];

export const HTTP_STATUS_DOCS = [
  { code: 200, label: 'OK', description: 'Request succeeded.' },
  { code: 202, label: 'Accepted', description: 'Job accepted for background processing.' },
  { code: 400, label: 'Bad Request', description: 'Missing or invalid parameters.' },
  { code: 402, label: 'Payment Required', description: 'Insufficient credits — upgrade or top up.' },
  { code: 403, label: 'Forbidden', description: 'Plan does not include this feature.' },
  { code: 500, label: 'Server Error', description: 'Unexpected failure; retry with backoff.' },
];

export const AUTH_DOCS = {
  title: 'Authentication',
  paragraphs: [
    'Include your user identifier on mutating requests. The dashboard injects user_id automatically when you use the official web app.',
    'Credit-consuming operations return HTTP 402 when the balance is too low. Check balance with GET /api/credits/balance/{user_id} before batch jobs.',
  ],
};
