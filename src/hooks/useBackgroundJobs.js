import { useEffect, useRef, useCallback } from 'react';
import { videoAPI } from '../services/api';
import { transcriptionResultPath } from '../utils/transcriptionRoutes';

const POLL_MS = 4000;
const STORAGE_KEY = 'avoices_job_statuses';

const ACTIVE = new Set([
  'starting', 'queued', 'pending', 'processing', 'synthesizing', 'in_progress', 'partial',
]);
const TERMINAL_OK = new Set(['completed', 'done', 'success']);
const TERMINAL_FAIL = new Set(['failed', 'error', 'cancelled']);

const JOB_LABELS = {
  transcription: 'Transcription',
  video_transcription: 'Video transcription',
  audio_transcription: 'Audio transcription',
  dubbing: 'Video dubbing',
  slideshow_render: 'Slideshow',
  video_render: 'Voiceover render',
  tts_generation: 'Text-to-speech',
  vocify: 'Voice conversion',
};

function loadStatuses() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatuses(map) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function normalizeTrackedEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === 'string') return { status: entry };
  if (typeof entry === 'object') return entry;
  return { status: String(entry) };
}

function trackedStatus(entry) {
  return String(normalizeTrackedEntry(entry)?.status || '').toLowerCase();
}

/** Call when the client starts a job so completion toasts fire reliably. */
export function registerTrackedJob(jobId, status = 'processing', meta = {}) {
  if (!jobId) return;
  const map = loadStatuses();
  map[jobId] = { status, ...meta };
  saveStatuses(map);
}

function formatElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function jobLabel(job) {
  const type = job?.job_type || 'job';
  return JOB_LABELS[type] || String(type).replace(/_/g, ' ');
}

function notifyCompletion(job, failed) {
  const title = job?.title || jobLabel(job);
  const elapsed = job?.elapsed_seconds != null ? formatElapsed(job.elapsed_seconds) : '';
  const suffix = elapsed ? ` (${elapsed})` : '';
  window.dispatchEvent(new CustomEvent('app-notification', {
    detail: {
      type: failed ? 'error' : 'success',
      title: failed
        ? `${jobLabel(job)} failed`
        : `${jobLabel(job)} complete${suffix}`,
      message: failed
        ? (job?.error || title)
        : title,
    },
  }));
  window.dispatchEvent(new CustomEvent('library-updated'));
}

function openTranscriptionResult(job, trackedMeta) {
  const type = String(job?.job_type || '').toLowerCase();
  const isTranscription = type === 'transcription'
    || type === 'video_transcription'
    || type === 'audio_transcription'
    || type === 'transcribe_video'
    || type === 'transcribe_audio'
    || trackedMeta?.mediaType;

  if (!isTranscription) return;

  let path = transcriptionResultPath(job);
  if (!path && trackedMeta?.mediaType) {
    const docId = job?.result?.doc_id || job?.job_id;
    path = trackedMeta.mediaType === 'video'
      ? `/dashboard/video/${docId}`
      : `/dashboard/audio/${docId}`;
  }
  if (!path) return;

  // Avoid hijacking navigation when the user is already viewing another result.
  const onResultPage = /^\/dashboard\/(audio|video)\//.test(window.location.pathname);
  if (onResultPage) return;

  window.location.assign(path);
}

/**
 * Poll active + recent jobs; fire in-app toast when a tracked job finishes.
 */
export default function useBackgroundJobs(userId) {
  const statusesRef = useRef(loadStatuses());
  const pollingRef = useRef(false);

  const trackJob = useCallback((jobId, status = 'processing', meta = {}) => {
    if (!jobId) return;
    statusesRef.current[jobId] = { status, ...meta };
    saveStatuses(statusesRef.current);
  }, []);

  useEffect(() => {
    if (!userId) return undefined;

    const poll = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const [activeRes, recentRes] = await Promise.all([
          videoAPI.listActiveJobs(userId, 30),
          videoAPI.listUserJobs(userId, 40),
        ]);
        const jobs = [
          ...(activeRes?.jobs || []),
          ...(recentRes?.jobs || []),
        ];
        const seen = new Set();

        for (const job of jobs) {
          const id = job?.job_id;
          if (!id || seen.has(id)) continue;
          seen.add(id);

          const status = String(job.status || '').toLowerCase();
          const prevEntry = normalizeTrackedEntry(statusesRef.current[id]);
          const prev = trackedStatus(statusesRef.current[id]);

          if (prev && ACTIVE.has(prev) && TERMINAL_OK.has(status)) {
            notifyCompletion(job, false);
            openTranscriptionResult(job, prevEntry);
          } else if (prev && ACTIVE.has(prev) && TERMINAL_FAIL.has(status)) {
            notifyCompletion(job, true);
          } else if (!prev && ACTIVE.has(status)) {
            /* newly discovered in-flight job */
          }

          if (ACTIVE.has(status) || TERMINAL_OK.has(status) || TERMINAL_FAIL.has(status)) {
            const existing = normalizeTrackedEntry(statusesRef.current[id]) || {};
            statusesRef.current[id] = { ...existing, status };
          }
        }
        saveStatuses(statusesRef.current);
      } catch {
        /* silent — will retry */
      } finally {
        pollingRef.current = false;
      }
    };

    poll();
    const iv = setInterval(poll, POLL_MS);
    return () => clearInterval(iv);
  }, [userId]);

  return { trackJob };
}

export { formatElapsed, jobLabel, ACTIVE as ACTIVE_JOB_STATUSES };
