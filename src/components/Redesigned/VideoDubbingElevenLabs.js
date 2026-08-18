import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { VideoLibrary, CloudUpload, Translate, Edit, RecordVoiceOver } from '@mui/icons-material';
import {
  ElevenLabsButton,
  ElevenLabsFileUpload,
  SettingSelect,
  SettingToggle,
  ElevenLabsSettingsPanel,
  SettingSection,
  PropertySection,
  PropertyRow,
} from '../ElevenLabsUI';
import StudioPageShell from '../Layout/StudioPageShell';
import StudioHistorySection from '../Layout/StudioHistorySection';
import { videoAPI, translationAPI, getFriendlyErrorMessage, BASE_URL, studioPlaybackUrl } from '../../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../../constants/neural_config';
import useStudioUser from '../../hooks/useStudioUser';
import { StudioJobProgressBar } from '../progress';
import SoundtrackPickerSection, { useSoundtrackPicker } from './SoundtrackPickerSection';

const PHASE = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SEGMENTS: 'segments',
  EXPORTING: 'exporting',
  DONE: 'done',
};

const WORKFLOW_STEPS = [
  'Upload video',
  'Transcribe',
  'Edit transcript',
  'Translate',
  'Generate dubbed video',
];

const normalizeSegments = (raw) =>
  (raw || [])
    .filter((s) => s && String(s.text || '').trim())
    .map((s) => ({
      ...s,
      start_time: Number(s.start_time ?? s.start ?? 0),
      end_time: Number(s.end_time ?? s.end ?? 0),
      text: String(s.text || '').trim(),
      translated: s.translated || '',
    }));

export default function VideoDubbingElevenLabs({ userId: userIdProp }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userId: hookUserId, balance } = useStudioUser();
  const userId = userIdProp || hookUserId;

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('lg');
  const [selectedVoice, setSelectedVoice] = useState(NEURAL_SPEAKERS[0].id);
  const [burnSubtitles, setBurnSubtitles] = useState(false);
  const [docId, setDocId] = useState(null);
  const [segments, setSegments] = useState([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [exportDocId, setExportDocId] = useState(null);
  const [dryVideoUrl, setDryVideoUrl] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusMessage, setExportStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(0);
  const dubPollRef = useRef(null);
  const dubPollMetaRef = useRef({ lastProgress: -1, lastChange: 0 });
  const soundtrack = useSoundtrackPicker();

  const stopDubPoll = () => {
    if (dubPollRef.current) {
      clearInterval(dubPollRef.current);
      dubPollRef.current = null;
    }
  };

  useEffect(() => () => stopDubPoll(), []);

  const handleVideoSelect = (file) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setSegments([]);
    setDocId(null);
    setFinalVideoUrl(null);
    setSourceVideoUrl(null);
    setWorkflowStep(1);
    setPhase(PHASE.IDLE);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => setVideoDuration(vid.duration || 0);
    vid.src = url;
  };

  const pollSegments = (did) =>
    new Promise((resolve, reject) => {
      const started = Date.now();
      const iv = setInterval(async () => {
        if (Date.now() - started > 45 * 60 * 1000) {
          clearInterval(iv);
          reject(new Error('Transcription timed out'));
          return;
        }
        try {
          const data = await videoAPI.getVideo(did);
          const entry = (data.entries || []).find((e) => e.doc_id === did) || data.entries?.[0];
          const transcriptions = entry?.timestamped_transcriptions;
          const usable = normalizeSegments(transcriptions);
          if (usable.length > 0) {
            clearInterval(iv);
            if (entry?.url) setSourceVideoUrl(entry.url);
            resolve(
              usable.map((s) => ({
                ...s,
                translated: '',
                voice: selectedVoice,
                lang: targetLang,
              }))
            );
          }
        } catch {
          /* retry */
        }
      }, 3000);
    });

  const pollJobDocId = (jobId) =>
    new Promise((resolve, reject) => {
      const started = Date.now();
      const iv = setInterval(async () => {
        if (Date.now() - started > 30 * 60 * 1000) {
          clearInterval(iv);
          reject(new Error('Processing timed out'));
          return;
        }
        try {
          const job = await videoAPI.getJobStatus(jobId);
          if (job.status === 'completed' && job.result?.doc_id) {
            clearInterval(iv);
            resolve({
              docId: job.result.doc_id,
              videoUrl: job.result.video_url || job.output_url || null,
            });
          } else if (job.status === 'failed' || job.status === 'error') {
            clearInterval(iv);
            reject(new Error(job.error || 'Processing failed'));
          }
        } catch (e) {
          /* retry */
        }
      }, 3000);
    });

  const handleProcess = async () => {
    if (!videoFile || !userId) return;
    setError(null);
    setPhase(PHASE.PROCESSING);
    try {
      const res = await videoAPI.extractAudioFromVideo(videoFile, sourceLang, userId);
      let did = res.doc_id;
      let videoUrl = res.video_url || null;
      if (res.job_id) {
        const polled = await pollJobDocId(res.job_id);
        did = polled.docId;
        videoUrl = polled.videoUrl || videoUrl;
      }
      if (!did) throw new Error('No document ID returned');
      if (videoUrl) setSourceVideoUrl(videoUrl);
      setDocId(did);
      const segs = await pollSegments(did);
      if (!segs.length) throw new Error('Transcription returned no usable segments');
      setSegments(segs);
      setWorkflowStep(2);
      setPhase(PHASE.SEGMENTS);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Failed to process video'));
      setPhase(PHASE.IDLE);
    }
  };

  const handleTranslateAll = async () => {
    if (!userId || !segments.length) return;
    setPhase(PHASE.PROCESSING);
    setError(null);
    try {
      const payload = segments.map((seg, i) => ({
        item_id: String(i),
        segment_index: i,
        text: seg.text,
        start_time: seg.start_time,
        end_time: seg.end_time,
      }));
      const response = await translationAPI.translateBatch(
        payload,
        sourceLang,
        [targetLang],
        userId,
      );
      const byId = Object.fromEntries(
        (response.segments || []).map((s) => [String(s.item_id), s.translated || s.text]),
      );
      const translated = segments.map((seg, i) => ({
        ...seg,
        translated: byId[String(i)] || seg.text,
        voice: selectedVoice,
        lang: targetLang,
      }));
      setSegments(translated);
      setWorkflowStep(3);
      setPhase(PHASE.SEGMENTS);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Translation failed'));
      setPhase(PHASE.SEGMENTS);
    }
  };

  const pollDubbingJob = (jobId) => {
    stopDubPoll();
    dubPollMetaRef.current = { lastProgress: -1, lastChange: Date.now() };
    dubPollRef.current = setInterval(async () => {
      try {
        const job = await videoAPI.getJobStatus(jobId);
        const progress = Number.isFinite(job.progress) ? job.progress : 0;
        setExportProgress(progress);
        if (job.progress_message) {
          setExportStatusMessage(job.progress_message);
        } else if (job.tts_segment_total) {
          setExportStatusMessage(
            `Batch voice synthesis (${job.tts_segment || 0}/${job.tts_segment_total})`,
          );
        }

        const meta = dubPollMetaRef.current;
        if (progress !== meta.lastProgress) {
          meta.lastProgress = progress;
          meta.lastChange = Date.now();
        } else if (Date.now() - meta.lastChange > 5 * 60 * 1000) {
          setError(
            job.error ||
              'Dubbing stalled — the voice server may be offline or overloaded. Check TTS_API_URL and try again.'
          );
          setPhase(PHASE.SEGMENTS);
          setWorkflowStep(3);
          stopDubPoll();
          return;
        }

        if (job.status === 'completed' && job.result?.dubbed_video_url) {
          setFinalVideoUrl(job.result.dubbed_video_url);
          setDryVideoUrl(job.result.dry_dubbed_video_url || job.result.dubbed_video_url);
          if (job.result.doc_id) setExportDocId(job.result.doc_id);
          setPhase(PHASE.DONE);
          setWorkflowStep(4);
          stopDubPoll();
          window.dispatchEvent(new CustomEvent('library-updated'));
        } else if (job.status === 'failed' || job.status === 'error') {
          setError(job.error || 'Export failed');
          setPhase(PHASE.SEGMENTS);
          setWorkflowStep(3);
          stopDubPoll();
        }
      } catch {
        /* retry */
      }
    }, 3000);
  };

  const handleExport = async () => {
    if (!docId || !userId || !segments.length) return;
    if (!sourceVideoUrl && !videoFile) {
      setError('Source video not found. Re-transcribe the video or upload again.');
      return;
    }
    setError(null);
    setPhase(PHASE.EXPORTING);
    setWorkflowStep(4);
    setExportProgress(5);
    setExportStatusMessage('Starting dubbing export…');
    try {
      const payload = segments.map((s, i) => {
        const startMs = Math.round((s.start_time || 0) * 1000);
        let endMs = Math.round((s.end_time || 0) * 1000);
        if (endMs <= startMs) {
          const next = segments[i + 1];
          endMs = next
            ? Math.round((next.start_time || 0) * 1000)
            : Math.round(videoDuration * 1000);
        }
        if (endMs <= startMs) endMs = startMs + 1500;
        return {
          segment_index: i,
          text: (s.translated || s.text || '').trim(),
          target_lang: s.lang || targetLang,
          speaker_id: s.voice || selectedVoice,
          start_time_ms: startMs,
          end_time_ms: endMs,
        };
      }).filter((s) => s.text);

      if (!payload.length) throw new Error('No translated text to dub');

      const res = await videoAPI.finalizeDubbing(
        docId,
        payload,
        userId,
        sourceVideoUrl ? null : videoFile,
        {
          videoDurationMins: videoDuration / 60,
          originalVolume: 0,
          burnSubtitles,
          trimStartMs: 0,
          trimEndMs: Math.round(videoDuration * 1000),
          videoUrl: sourceVideoUrl || undefined,
        }
      );
      if (res?.job_id) {
        if (res.doc_id) setExportDocId(res.doc_id);
        pollDubbingJob(res.job_id);
        return;
      }
      if (res.dubbed_video_url) {
        setFinalVideoUrl(res.dubbed_video_url);
        setDryVideoUrl(res.dry_dubbed_video_url || res.dubbed_video_url);
        if (res.doc_id) setExportDocId(res.doc_id);
        setPhase(PHASE.DONE);
        setWorkflowStep(4);
        window.dispatchEvent(new CustomEvent('library-updated'));
      }
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Export failed'));
      setPhase(PHASE.SEGMENTS);
    }
  };

  const updateSegment = (index, field, value) => {
    setSegments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const langOptions = NEURAL_LANGUAGES.filter((l) => l.code !== 'all').map((l) => ({
    value: l.code,
    label: l.name,
  }));

  const voiceOptions = NEURAL_SPEAKERS;

  const busy = phase === PHASE.PROCESSING || phase === PHASE.EXPORTING;
  const activeStep = videoFile ? Math.min(workflowStep, WORKFLOW_STEPS.length - 1) : 0;
  const progressMessage =
    phase === PHASE.EXPORTING
      ? 'Generating dubbed video…'
      : workflowStep < 2
        ? 'Transcribing video…'
        : 'Translating segments…';
  const progressSubmessage =
    phase === PHASE.EXPORTING
      ? exportStatusMessage || (exportProgress > 0
        ? `${Math.round(exportProgress)}% — batch voice synthesis and muxing video`
        : 'Step 5: Batch voice synthesis, then video mux')
      : workflowStep < 2
        ? 'Step 2: Extract audio and run speech recognition'
        : 'Step 4: Machine translation into target language';
  const canTranscribe = Boolean(videoFile) && !busy;
  const canTranslate = segments.length > 0 && workflowStep >= 2 && !busy;
  const canExport = segments.some((s) => (s.translated || s.text || '').trim()) && workflowStep >= 2 && !busy;

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Languages">
        <SettingSelect
          label="Source language"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          options={langOptions}
        />
        <SettingSelect
          label="Target language"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          options={langOptions}
        />
      </SettingSection>
      <SettingSection title="Voice">
        <SettingSelect
          label="Speaker"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          options={voiceOptions.map((v) => ({
            value: v.id,
            label: `${v.name} · native ${v.lang.toUpperCase()}`,
          }))}
        />
        <Typography sx={{ fontSize: '0.75rem', color: '#888', px: 0.5, mt: -0.5 }}>
          Any speaker can dub into your target language.
        </Typography>
      </SettingSection>
      <SettingSection title="Export">
        <SettingToggle
          label="Add subtitles"
          checked={burnSubtitles}
          onChange={(e) => setBurnSubtitles(e.target.checked)}
          description="Embed translated text as subtitles in the exported video"
        />
      </SettingSection>
      <SoundtrackPickerSection
        {...soundtrack}
        dryAudioUrl={dryVideoUrl}
        docId={exportDocId}
        source="dubbing"
        userId={userId}
        onApplied={(url) => setFinalVideoUrl(url)}
        applyLabel="Save dubbed video with soundtrack"
      />
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credits" value={balance !== null ? balance.toFixed(2) : '…'} />
        <PropertyRow label="Segments" value={String(segments.length)} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          disabled={!canTranscribe}
          loading={phase === PHASE.PROCESSING && workflowStep < 2}
          onClick={handleProcess}
        >
          {segments.length ? '1. Re-transcribe video' : '1. Transcribe video'}
        </ElevenLabsButton>
        <ElevenLabsButton
          variant="outlined"
          fullWidth
          disabled={!canTranslate}
          startIcon={<Translate />}
          onClick={handleTranslateAll}
        >
          2. Translate to {targetLang.toUpperCase()}
        </ElevenLabsButton>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          disabled={!canExport}
          loading={phase === PHASE.EXPORTING}
          startIcon={<RecordVoiceOver />}
          onClick={handleExport}
        >
          3. Generate dubbed video
        </ElevenLabsButton>
      </Box>
    </ElevenLabsSettingsPanel>
  );

  const previewUrl =
    (phase === PHASE.DONE && exportDocId ? studioPlaybackUrl('dubbing', exportDocId) : null)
    || finalVideoUrl
    || videoUrl;

  return (
    <>
      <StudioPageShell
        icon={<VideoLibrary sx={{ fontSize: 22 }} />}
        title="Video dubbing"
        subtitle="Transcribe → edit → translate → generate voice → export dubbed video"
        maxWidth={1040}
        settingsContent={settingsContent}
        showPropertiesPanel={!isMobile}
      >
        <StudioJobProgressBar
          open={busy}
          message={progressMessage}
          submessage={progressSubmessage}
          progress={phase === PHASE.EXPORTING && exportProgress > 0 ? exportProgress : undefined}
        />

        {videoFile && (
          <Box sx={{ mb: 3, px: { xs: 0, md: 1 } }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 1 }}>
              {WORKFLOW_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography sx={{ fontSize: '0.8125rem', color: '#888', textAlign: 'center' }}>
              {workflowStep < 2 && 'Review and edit the source transcript before translating.'}
              {workflowStep === 2 && segments.length > 0 && !segments.some((s) => s.translated) && (
                <>Edit any segment below, then click <strong>Translate</strong>.</>
              )}
              {workflowStep >= 3 && phase !== PHASE.EXPORTING && phase !== PHASE.DONE && (
                <>Edit translations if needed, then <strong>Generate dubbed video</strong> (TTS + mux).</>
              )}
              {phase === PHASE.DONE && 'Dubbed video is ready — preview above or add a soundtrack in settings.'}
            </Typography>
          </Box>
        )}
        {!videoFile ? (
          <Box
            sx={{
              border: '2px dashed #e8e8e8',
              borderRadius: '16px',
              bgcolor: '#fafafa',
              p: { xs: 3, md: 5 },
              textAlign: 'center',
            }}
          >
            <CloudUpload sx={{ fontSize: 32, color: '#E8A020', mb: 1 }} />
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Upload your video</Typography>
            <ElevenLabsFileUpload
              onFileSelect={handleVideoSelect}
              selectedFile={videoFile}
              onClearFile={() => {
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                setVideoFile(null);
                setVideoUrl(null);
                setSegments([]);
              }}
              accept="video/*"
            />
          </Box>
        ) : (
          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: '#000',
              aspectRatio: '16/9',
              maxHeight: 360,
              mb: 3,
            }}
          >
            <video
              src={previewUrl}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
        )}

        {phase === PHASE.EXPORTING && exportProgress > 0 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={exportProgress} sx={{ height: 6, borderRadius: 3 }} />
            <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
              {exportStatusMessage || `Exporting… ${Math.round(exportProgress)}%`}
            </Typography>
          </Box>
        )}

        {segments.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Edit sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Step 3 — Edit transcript & translation ({segments.length} segments)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 420, overflowY: 'auto' }}>
              {segments.map((seg, i) => (
                <Box
                  key={i}
                  sx={{
                    border: '1px solid #e8e8e8',
                    borderRadius: '10px',
                    p: 2,
                    bgcolor: '#fff',
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', color: '#999', mb: 1 }}>
                    {seg.start_time?.toFixed(1)}s – {seg.end_time?.toFixed(1)}s
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#aaa', mb: 0.5, textTransform: 'uppercase' }}>
                    Source ({sourceLang})
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    value={seg.text || ''}
                    onChange={(e) => updateSegment(i, 'text', e.target.value)}
                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '8px' } }}
                  />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#aaa', mb: 0.5, textTransform: 'uppercase' }}>
                    Translation ({targetLang})
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    placeholder="Translation…"
                    value={seg.translated || ''}
                    onChange={(e) => updateSegment(i, 'translated', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '8px' } }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <StudioHistorySection sourceId="dubbing" />
      </StudioPageShell>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
    </>
  );
}
