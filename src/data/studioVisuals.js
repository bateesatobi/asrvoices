/**
 * Shared stills and short loops for studio / marketing surfaces.
 * Unsplash editorial photos and Mixkit Free License clips — decorative only.
 */

export const unsplash = (id, extra = '') =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80${extra}`;

export const mixkit = (id) => ({
  poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
  video: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
});

const MIX_VIDEO = mixkit(42582); // handheld camera / production

export const STUDIO_VISUALS = {
  transcribe: {
    image: unsplash('photo-1478737270239-2f02b77fc618'),
    caption: 'Broadcast / recording',
  },
  translate: {
    image: unsplash('photo-1481627834876-b7833e8f5570'),
  },
  tts: {
    image: unsplash('photo-1590602847861-f357a9332bbc'),
  },
  summarize: {
    image: unsplash('photo-1455390582262-044cdead277a'),
  },
  video: {
    image: MIX_VIDEO.poster,
    video: MIX_VIDEO.video,
  },
  voices: {
    image: unsplash('photo-1516280440614-37939bbacd81'),
  },
  soundtracks: {
    image: unsplash('photo-1511671782779-c97d3d27a1d4'),
  },
  languages: {
    image: unsplash('photo-1524661135-423995f22d0b'),
  },
  ads: {
    image: unsplash('photo-1469334031218-e382a71b716b'),
  },
  voiceover: {
    image: unsplash('photo-1598488035139-bdbb2231ce04'),
  },
};

/** Four cinematic home stories — dashboard + public marketing. */
export const HOME_STORIES = [
  {
    id: 'transcribe',
    title: 'Transcribe',
    desc: 'Speech and video → text, SRT, and JSON',
    path: '/dashboard/transcribe',
    publicPath: '/get-started',
    image: STUDIO_VISUALS.transcribe.image,
  },
  {
    id: 'speak',
    title: 'Speak',
    desc: 'Neural voices for scripts and documents',
    path: '/dashboard/synthesize',
    publicPath: '/get-started',
    image: STUDIO_VISUALS.tts.image,
  },
  {
    id: 'video',
    title: 'Video',
    desc: 'Dub and narrate with a timeline, not a card stack',
    path: '/dashboard/video-voiceover',
    publicPath: '/get-started',
    image: STUDIO_VISUALS.video.image,
    video: STUDIO_VISUALS.video.video,
  },
  {
    id: 'ads',
    title: 'Ads',
    desc: 'Lookbooks, product stills, and short loops',
    path: '/dashboard/ad-creative',
    publicPath: '/get-started',
    image: STUDIO_VISUALS.ads.image,
  },
];

const TRACK_COVERS = [
  unsplash('photo-1511671782779-c97d3d27a1d4', '&w=600'),
  unsplash('photo-1511379938547-c1f69419868d', '&w=600'),
  unsplash('photo-1470225620780-dba8ba36b745', '&w=600'),
  unsplash('photo-1493225457124-a3eb161ffa5f', '&w=600'),
  unsplash('photo-1483412036651-81e8e0d32e04', '&w=600'),
  unsplash('photo-1459749411177-04aa50016c25', '&w=600'),
  unsplash('photo-1508700115892-45ecd05ae2ad', '&w=600'),
  unsplash('photo-1514525253161-7a46d19cd819', '&w=600'),
];

const VOICE_SCENES = [
  unsplash('photo-1598488035139-bdbb2231ce04', '&w=800'),
  unsplash('photo-1590602847861-f357a9332bbc', '&w=800'),
  unsplash('photo-1516280440614-37939bbacd81', '&w=800'),
  unsplash('photo-1478737270239-2f02b77fc618', '&w=800'),
  unsplash('photo-1487180144351-b8472da7d491', '&w=800'),
  unsplash('photo-1511379938547-c1f69419868d', '&w=800'),
];

function hashKey(key) {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function soundtrackCover(track) {
  return TRACK_COVERS[hashKey(track?.id || track?.filename) % TRACK_COVERS.length];
}

export function voiceScene(speaker) {
  return VOICE_SCENES[hashKey(speaker?.id || speaker?.name) % VOICE_SCENES.length];
}

export const TYPE_SCENE = {
  transcription: STUDIO_VISUALS.transcribe.image,
  video: STUDIO_VISUALS.video.image,
  translation: STUDIO_VISUALS.translate.image,
  tts: STUDIO_VISUALS.tts.image,
  document_tts: STUDIO_VISUALS.tts.image,
  summary: STUDIO_VISUALS.summarize.image,
  dubbing: STUDIO_VISUALS.video.image,
  voiceover: STUDIO_VISUALS.video.image,
  vox: STUDIO_VISUALS.tts.image,
};
