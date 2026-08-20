/**
 * Guided-tour step definitions, keyed by tour id.
 * Steps target elements via `data-tour="<id>"` attributes (CSS selector below).
 * A step with no `selector` (or a missing target) renders a centered card.
 */
export const TOUR_IDS = {
  dashboard: 'dashboard_v1',
  transcribe: 'transcribe_v1',
  synthesize: 'synthesize_v1',
  translate: 'translate_v1',
  dubbing: 'dubbing_v1',
  voiceover: 'voiceover_v1',
  summarize: 'summarize_v1',
};

export const dashboardTour = [
  {
    eyebrow: 'Welcome',
    title: 'Welcome to A·VOICES 👋',
    body: 'A quick 30-second tour of your workspace. You can replay it any time from the help button in the top bar.',
  },
  {
    selector: '[data-tour="quick-actions"]',
    title: 'Start a new project',
    body: 'Four cinematic stories — Transcribe, Speak, Video, and Ads. Click a still or loop to open that studio.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="stat-balance"]',
    title: 'Your credit balance',
    body: 'Every job uses credits. This chip shows what you have left — click it to top up anytime.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="stat-progress"]',
    title: 'Track work in progress',
    body: 'Long renders (dubbing, slideshows) keep running in the background. See how many are processing right here.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="recent-projects"]',
    title: 'Pick up where you left off',
    body: 'Your latest projects appear here. Click any row to open its result — play it back, download, or send it to the next studio.',
    placement: 'top',
  },
  {
    selector: '[data-tour="nav-rail"]',
    title: 'Everything in one place',
    body: 'Switch between studios and your Library from the sidebar. Hover any item for a quick label.',
    placement: 'right',
  },
  {
    selector: '[data-tour="notifications"]',
    title: 'Stay notified',
    body: 'When a background job finishes we drop a notification here (and email you), so you never have to wait around.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="help"]',
    title: 'Need this again?',
    body: 'Replay this tour or find help here whenever you like. That’s it — enjoy creating!',
    placement: 'bottom',
  },
];

export const transcribeTour = [
  {
    eyebrow: 'Transcribe',
    title: 'Speech → text',
    body: 'Turn any recording into an accurate, editable transcript with timestamps and subtitle exports.',
  },
  {
    selector: '[data-tour="studio-mode"]',
    title: 'Upload or record',
    body: 'Drop in an audio or video file (we extract the audio for you), or record live from your microphone.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="studio-input"]',
    title: 'Add your media',
    body: 'Files up to 50 MB. MP3, WAV, MP4 and MOV all work — no need to convert anything first.',
    placement: 'top',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Follow the steps',
    body: 'Pick the spoken language and output format, then transcribe. Your transcript opens here ready to copy, export, or send to Translate.',
    placement: 'top',
  },
];

export const synthesizeTour = [
  {
    eyebrow: 'Synthesize',
    title: 'Text → natural speech',
    body: 'Generate lifelike narration from text or whole documents, in dozens of voices and languages.',
  },
  {
    selector: '[data-tour="studio-mode"]',
    title: 'Text or document',
    body: 'Type/paste text, or upload a document and let us read it aloud end-to-end.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Voice, language, generate',
    body: 'Choose a voice and language, preview, then generate. The estimated credit cost shows before you commit.',
    placement: 'top',
  },
];

export const translateTour = [
  {
    eyebrow: 'Translate',
    title: 'Translate text & documents',
    body: 'Fast, high-quality translation between dozens of languages — with live streaming as it works.',
  },
  {
    selector: '[data-tour="studio-mode"]',
    title: 'Text or document',
    body: 'Translate text you paste in, or upload a document to translate it while keeping its structure.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Pick languages & go',
    body: 'Set source and target languages, review, then translate. From the result you can send straight to Synthesize or Dubbing.',
    placement: 'top',
  },
];

export const dubbingTour = [
  {
    eyebrow: 'Video Dubbing',
    title: 'Dub videos in any language',
    body: 'Upload a video, translate the dialogue, and replace the audio with natural voices — lip-timed to the original.',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Your dubbing workflow',
    body: 'Upload → review the auto transcript → translate → pick voices → render. Each segment shows on a waveform you can fine-tune.',
    placement: 'top',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Render in the background',
    body: 'Long videos can keep rendering after you leave. Choose “Render in background & email me” and we’ll notify you when it’s ready.',
    placement: 'top',
  },
];

export const voiceoverTour = [
  {
    eyebrow: 'Voiceovers',
    title: 'Narration & slideshows',
    body: 'Create multi-block voiceovers, narrate over an uploaded video, or turn images into a voiced slideshow.',
  },
  {
    selector: '[data-tour="studio-mode"]',
    title: 'Narration or slideshow',
    body: 'Narration Mode voices your script (optionally over a video). Slideshow Mode turns images + script into a finished video.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Build it step by step',
    body: 'Add your media/blocks, assign voices and languages, then generate. Big renders email you when they finish.',
    placement: 'top',
  },
];

export const summarizeTour = [
  {
    eyebrow: 'Summarize',
    title: 'Turn long content into quick answers',
    body: 'Paste text, upload a file, or summarize audio/video. We’ll generate a clean, readable summary in seconds.',
  },
  {
    selector: '[data-tour="studio-mode"]',
    title: 'Choose your input type',
    body: 'Select Paste Text, Document, Audio, or Video — the studio adapts the upload area automatically.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="studio-input"]',
    title: 'Add your content',
    body: 'Drop or upload a file (or paste text), then move to Language & Length to fine-tune the output.',
    placement: 'top',
  },
  {
    selector: '[data-tour="studio-flow"]',
    title: 'Generate the summary',
    body: 'Pick your language and target word count, then generate. You can open the result when it’s ready.',
    placement: 'top',
  },
];

export const TOURS = {
  [TOUR_IDS.dashboard]: dashboardTour,
  [TOUR_IDS.transcribe]: transcribeTour,
  [TOUR_IDS.synthesize]: synthesizeTour,
  [TOUR_IDS.translate]: translateTour,
  [TOUR_IDS.dubbing]: dubbingTour,
  [TOUR_IDS.voiceover]: voiceoverTour,
  [TOUR_IDS.summarize]: summarizeTour,
};

/**
 * Maps a dashboard route segment (last path part) to its tour.
 * Used by the header help button to launch the right tour for the page.
 */
export const SEGMENT_TOURS = {
  home: { id: TOUR_IDS.dashboard, steps: dashboardTour },
  transcribe: { id: TOUR_IDS.transcribe, steps: transcribeTour },
  synthesize: { id: TOUR_IDS.synthesize, steps: synthesizeTour },
  translate: { id: TOUR_IDS.translate, steps: translateTour },
  dubbing: { id: TOUR_IDS.dubbing, steps: dubbingTour },
  voiceovers: { id: TOUR_IDS.voiceover, steps: voiceoverTour },
  summarize: { id: TOUR_IDS.summarize, steps: summarizeTour },
};
