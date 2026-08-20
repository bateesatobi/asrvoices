import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  RecordVoiceOver,
  Add,
  Delete,
  Image as ImageIcon,
  VideoLibrary,
} from '@mui/icons-material';
import {
  ElevenLabsButton,
  ElevenLabsFileUpload,
  ElevenLabsTabs,
  SettingSelect,
  SettingToggle,
  ElevenLabsSettingsPanel,
  SettingSection,
  PropertySection,
  PropertyRow,
  StudioPlayerBar,
} from '../ElevenLabsUI';
import StudioPageShell from '../Layout/StudioPageShell';
import StudioHistorySection from '../Layout/StudioHistorySection';
import { STUDIO_VISUALS } from '../../data/studioVisuals';
import { ttsAPI, videoAPI, getFriendlyErrorMessage, BASE_URL } from '../../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../../constants/neural_config';
import useStudioUser from '../../hooks/useStudioUser';
import { StudioJobProgressBar } from '../progress';
import SoundtrackPickerSection, { useSoundtrackPicker } from './SoundtrackPickerSection';

const MODES = [
  { label: 'Narration', icon: <RecordVoiceOver fontSize="small" /> },
  { label: 'Slideshow', icon: <ImageIcon fontSize="small" /> },
];

const NARRATION_STEPS = [
  'Upload video (optional)',
  'Write script',
  'Generate narration',
  'Create video',
];

const SLIDESHOW_STEPS = [
  'Upload images',
  'Write narrations',
  'Generate slideshow',
];

const newBlock = (lang, voice) => ({
  id: Date.now() + Math.random(),
  text: '',
  voice: voice || NEURAL_SPEAKERS[0].id,
  language: lang || NEURAL_SPEAKERS[0].lang,
  pitch: 0,
  rate: 1.0,
});

export default function VoiceoverElevenLabs({ userId: userIdProp }) {
  const { userId: hookUserId, balance, refreshBalance } = useStudioUser();
  const userId = userIdProp || hookUserId;
  const soundtrack = useSoundtrackPicker();

  const [mode, setMode] = useState(0);
  const [blocks, setBlocks] = useState([newBlock()]);
  const [selectedLang, setSelectedLang] = useState(NEURAL_SPEAKERS[0].lang);
  const [selectedVoice, setSelectedVoice] = useState(NEURAL_SPEAKERS[0].id);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [error, setError] = useState(null);
  const [combinedAudioUrl, setCombinedAudioUrl] = useState(null);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [resultDocId, setResultDocId] = useState(null);
  const [dryMediaUrl, setDryMediaUrl] = useState(null);
  const [resultSource, setResultSource] = useState('voiceover');
  const [burnSubtitles, setBurnSubtitles] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0);
  const slideshowPollRef = useRef(null);

  const steps = mode === 1 ? SLIDESHOW_STEPS : NARRATION_STEPS;
  const activeStep = Math.min(workflowStep, steps.length - 1);
  const populatedBlocks = blocks.filter((b) => b.text.trim());
  const hasScript = populatedBlocks.length > 0;
  const canGenerateNarration = hasScript && !loading;
  const canCreateVideo = Boolean(videoFile && resultDocId && combinedAudioUrl && !loading);
  const canGenerateSlideshow =
    imageFiles.length > 0 &&
    populatedBlocks.length >= imageFiles.length &&
    !loading;

  const stopPoll = () => {
    if (slideshowPollRef.current) {
      clearInterval(slideshowPollRef.current);
      slideshowPollRef.current = null;
    }
  };

  useEffect(() => () => {
    stopPoll();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const pollOptions = {
    onProgress: (job) => setJobProgress(Number.isFinite(job.progress) ? job.progress : 0),
  };

  const updateBlock = (id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addBlock = () => setBlocks((prev) => [...prev, newBlock(selectedLang, selectedVoice)]);
  const removeBlock = (id) => {
    if (blocks.length <= 1) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleModeChange = (_, v) => {
    setMode(v);
    setWorkflowStep(0);
    setError(null);
    setCombinedAudioUrl(null);
    setOutputVideoUrl(null);
    setResultDocId(null);
    setDryMediaUrl(null);
  };

  const handleVideoSelect = (file) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setOutputVideoUrl(null);
    setWorkflowStep(1);
  };

  const clearVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setOutputVideoUrl(null);
    setWorkflowStep(hasScript ? 1 : 0);
  };

  const handleImagesAdded = (files) => {
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);
    setBlocks((prev) => {
      const total = imageFiles.length + files.length;
      if (prev.length >= total) return prev;
      const extra = Array.from({ length: total - prev.length }, () =>
        newBlock(selectedLang, selectedVoice)
      );
      return [...prev, ...extra];
    });
    setWorkflowStep(1);
  };

  const pollSlideshowJob = (jobId) =>
    new Promise((resolve, reject) => {
      let attempts = 0;
      slideshowPollRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 240) {
          stopPoll();
          reject(new Error('Render timed out'));
          return;
        }
        try {
          const job = await videoAPI.getJobStatus(jobId);
          if (Number.isFinite(job.progress)) setJobProgress(job.progress);
          if (job.status === 'completed' && job.result?.slideshow_url) {
            stopPoll();
            resolve({
              url: job.result.slideshow_url,
              docId: job.result.doc_id,
            });
          } else if (job.status === 'error' || job.status === 'failed') {
            stopPoll();
            reject(new Error(job.error || 'Slideshow failed'));
          }
        } catch {
          /* retry */
        }
      }, 2000);
    });

  const handleGenerateNarration = async () => {
    if (!userId) {
      setError('Please log in to continue');
      return;
    }
    if (!hasScript) {
      setError('Add at least one script block with text');
      return;
    }

    setLoading(true);
    setLoadingPhase('narration');
    setError(null);
    setCombinedAudioUrl(null);
    setOutputVideoUrl(null);
    setResultDocId(null);
    setDryMediaUrl(null);
    setJobProgress(0);

    try {
      const res = await ttsAPI.renderVoiceover(
        populatedBlocks.map((b) => ({
          text: b.text,
          speaker_id: b.voice || selectedVoice,
          language: b.language || selectedLang,
          pitch: b.pitch,
          rate: b.rate,
        })),
        userId,
        `Narration – ${new Date().toLocaleString()}`,
        null,
        pollOptions
      );

      const dry = res.dry_combined_audio_url || res.combined_audio_url;
      if (dry) {
        setCombinedAudioUrl(dry);
        setDryMediaUrl(dry);
      }
      if (res.doc_id) {
        setResultDocId(res.doc_id);
        setResultSource('voiceover');
      }
      setWorkflowStep(videoFile ? 3 : 2);
      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Narration generation failed'));
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleCreateNarrationVideo = async () => {
    if (!userId || !resultDocId || !videoFile) return;

    setLoading(true);
    setLoadingPhase('video');
    setError(null);
    setJobProgress(0);

    try {
      const videoRes = await videoAPI.finalizeNarrationVideo(
        resultDocId,
        userId,
        videoFile,
        { ...pollOptions, burnSubtitles }
      );
      if (videoRes.narration_video_url) {
        setOutputVideoUrl(videoRes.narration_video_url);
        setWorkflowStep(3);
      }
      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Video export failed'));
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleGenerateSlideshow = async () => {
    if (!userId) {
      setError('Please log in to continue');
      return;
    }
    if (!imageFiles.length) {
      setError('Upload at least one image');
      return;
    }
    if (populatedBlocks.length < imageFiles.length) {
      setError('Add a script block for each image');
      return;
    }

    setLoading(true);
    setLoadingPhase('slideshow');
    setError(null);
    setOutputVideoUrl(null);
    setResultDocId(null);
    setDryMediaUrl(null);
    setJobProgress(0);

    try {
      const segments = populatedBlocks.slice(0, imageFiles.length).map((b) => ({
        text: b.text,
        speaker_id: b.voice || selectedVoice,
        target_lang: b.language || selectedLang,
        pitch: b.pitch,
        rate: b.rate,
      }));
      const res = await videoAPI.finalizeImageSlideshow(segments, userId, imageFiles, {
        burnSubtitles,
        ...pollOptions,
      });
      let url = res.slideshow_url;
      let resultId = res.doc_id;
      if (res.job_id) {
        const polled = await pollSlideshowJob(res.job_id);
        url = polled.url;
        resultId = polled.docId || resultId;
      }
      setOutputVideoUrl(url);
      setDryMediaUrl(url);
      if (resultId) {
        setResultDocId(resultId);
        setResultSource('slideshow');
      }
      setWorkflowStep(2);
      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Slideshow generation failed'));
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const langOptions = NEURAL_LANGUAGES.filter((l) => l.code !== 'all').map((l) => ({
    value: l.code,
    label: l.name,
  }));

  const workflowHint =
    mode === 0
      ? workflowStep < 1
        ? 'Upload a source video if you want narration muxed onto it — or skip and generate audio only.'
        : workflowStep < 2
          ? 'Write your narration script below. No transcription — you provide every line.'
          : workflowStep < 3
            ? combinedAudioUrl
              ? 'Narration audio is ready. Click Create video to replace the original soundtrack.'
              : 'Generate narration audio from your script blocks.'
            : 'Video with narration is ready.'
      : workflowStep < 1
        ? 'Upload images in order — each slide gets its own narration block.'
        : workflowStep < 2
          ? 'Add narration text for each slide, then generate the video.'
          : 'Slideshow video is ready.';

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Voice">
        <SettingSelect
          label="Output language"
          value={selectedLang}
          onChange={(e) => {
            setSelectedLang(e.target.value);
            setBlocks((prev) => prev.map((b) => ({ ...b, language: e.target.value })));
          }}
          options={langOptions}
        />
        <SettingSelect
          label="Speaker"
          value={selectedVoice}
          onChange={(e) => {
            setSelectedVoice(e.target.value);
            setBlocks((prev) => prev.map((b) => ({ ...b, voice: e.target.value })));
          }}
          options={NEURAL_SPEAKERS.map((v) => ({
            value: v.id,
            label: `${v.name} · native ${v.lang.toUpperCase()}`,
          }))}
        />
        <Typography sx={{ fontSize: '0.75rem', color: '#888', px: 0.5, mt: -0.5 }}>
          Choose who speaks and which language they use — independently.
        </Typography>
      </SettingSection>
      {mode === 0 ? (
        <SettingSection title="Video export">
          <SettingToggle
            label="Add subtitles"
            checked={burnSubtitles}
            onChange={(e) => setBurnSubtitles(e.target.checked)}
            description="Embed script text as subtitles on the exported video"
            disabled={!videoFile}
          />
        </SettingSection>
      ) : (
        <SettingSection title="Slideshow export">
          <SettingToggle
            label="Add subtitles"
            checked={burnSubtitles}
            onChange={(e) => setBurnSubtitles(e.target.checked)}
            description="Embed script text as subtitles on each slide in the final video"
          />
        </SettingSection>
      )}
      {mode === 0 && (
        <SoundtrackPickerSection
          {...soundtrack}
          dryAudioUrl={dryMediaUrl}
          docId={resultDocId}
          source={resultSource}
          userId={userId}
          onApplied={(url) => setCombinedAudioUrl(url)}
          applyLabel="Save with soundtrack"
        />
      )}
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credits" value={balance !== null ? balance.toFixed(2) : '…'} />
        <PropertyRow label="Blocks" value={String(blocks.length)} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {mode === 0 ? (
          <>
            <ElevenLabsButton
              variant="contained"
              fullWidth
              size="large"
              loading={loading && loadingPhase === 'narration'}
              disabled={!canGenerateNarration}
              onClick={handleGenerateNarration}
            >
              Generate narration
            </ElevenLabsButton>
            {videoFile && (
              <ElevenLabsButton
                variant="outlined"
                fullWidth
                size="large"
                loading={loading && loadingPhase === 'video'}
                disabled={!canCreateVideo}
                startIcon={<VideoLibrary />}
                onClick={handleCreateNarrationVideo}
              >
                Create video
              </ElevenLabsButton>
            )}
          </>
        ) : (
          <ElevenLabsButton
            variant="contained"
            fullWidth
            size="large"
            loading={loading && loadingPhase === 'slideshow'}
            disabled={!canGenerateSlideshow}
            onClick={handleGenerateSlideshow}
          >
            Generate slideshow
          </ElevenLabsButton>
        )}
      </Box>
    </ElevenLabsSettingsPanel>
  );

  const speaker = NEURAL_SPEAKERS.find((s) => s.id === selectedVoice) || NEURAL_SPEAKERS[0];
  const previewVideoUrl = outputVideoUrl || (mode === 0 ? videoUrl : null);

  return (
    <>
      <StudioPageShell
        icon={<RecordVoiceOver sx={{ fontSize: 22 }} />}
        title="Voiceover"
        subtitle={
          mode === 0
            ? 'Upload video (optional) → write script → generate narration → mux onto video'
            : 'Upload images → add narrations per slide → generate slideshow video'
        }
        maxWidth={1040}
        settingsContent={settingsContent}
        hideHeader={mode === 0 && workflowStep < 2 && !videoFile}
        hero={{
          image: STUDIO_VISUALS.voiceover.image,
          title: 'Voiceover',
          subtitle:
            mode === 0
              ? 'Optional clip on the still, then a script list — not a stack of cards'
              : 'Stills become slides; narration is a list under the header',
          height: mode === 0 && workflowStep < 2 && !videoFile ? 280 : 176,
          children:
            mode === 0 && workflowStep < 2 && !videoFile ? (
              <Box sx={{ mt: 2, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.94)', p: { xs: 2, md: 2.5 }, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Upload video (optional)</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#888', mb: 1.5 }}>
                  Skip for audio-only. You write the narration — no transcription.
                </Typography>
                <ElevenLabsFileUpload
                  onFileSelect={handleVideoSelect}
                  selectedFile={videoFile}
                  onClearFile={clearVideo}
                  accept="video/*"
                />
              </Box>
            ) : null,
        }}
        bottomBar={
          <StudioPlayerBar
            voiceName={speaker.name}
            voiceLang={selectedLang}
            audioUrl={combinedAudioUrl}
            disabled={!combinedAudioUrl}
            onDownload={() => {
              if (!combinedAudioUrl) return;
              const link = document.createElement('a');
              link.href = combinedAudioUrl.startsWith('http') ? combinedAudioUrl : `${BASE_URL}${combinedAudioUrl}`;
              link.download = 'voiceover.mp3';
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        }
      >
        <StudioJobProgressBar
          open={loading}
          message={
            loadingPhase === 'video'
              ? 'Creating video…'
              : loadingPhase === 'slideshow'
                ? 'Building slideshow…'
                : 'Synthesizing narration…'
          }
          submessage={
            jobProgress > 0
              ? `${Math.round(jobProgress)}% complete`
              : loadingPhase === 'slideshow'
                ? 'Rendering images and audio'
                : loadingPhase === 'video'
                  ? 'Muxing narration onto video'
                  : 'Generating voice blocks'
          }
        />
        <Box sx={{ mb: 2 }}>
          <ElevenLabsTabs value={mode} onChange={handleModeChange} tabs={MODES} />
        </Box>

        <Box sx={{ mb: 3, px: { xs: 0, md: 1 } }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Typography sx={{ fontSize: '0.8125rem', color: '#888', textAlign: 'center' }}>
            {workflowHint}
          </Typography>
        </Box>

        {mode === 0 && workflowStep < 2 && videoFile && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', mb: 1 }}>
              Source video · {videoFile.name}
            </Typography>
            <Box
              sx={{
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: '#000',
                aspectRatio: '16/9',
                maxHeight: 280,
              }}
            >
              <video
                src={videoUrl}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <ElevenLabsButton variant="text" size="small" onClick={clearVideo} sx={{ mt: 1 }}>
              Remove video
            </ElevenLabsButton>
          </Box>
        )}

        {mode === 0 && previewVideoUrl && workflowStep >= 2 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', mb: 1 }}>
              {outputVideoUrl ? 'Narration video' : 'Source video'}
            </Typography>
            <Box
              sx={{
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: '#000',
                aspectRatio: '16/9',
                maxHeight: 360,
              }}
            >
              <video
                src={previewVideoUrl}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
          </Box>
        )}

        {mode === 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', mb: 1 }}>
              Slideshow images ({imageFiles.length})
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                border: '1px dashed #e8e8e8',
                borderRadius: '10px',
                cursor: 'pointer',
                bgcolor: '#fafafa',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': { borderColor: '#E8A020' },
              }}
            >
              <ImageIcon sx={{ fontSize: 18, color: '#E8A020' }} />
              Add images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleImagesAdded(files);
                  e.target.value = '';
                }}
              />
            </Box>
            {imageFiles.length > 0 && (
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {imageFiles.map((f, i) => (
                  <Typography key={`${f.name}-${i}`} sx={{ fontSize: '0.75rem', color: '#666', bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: '6px' }}>
                    {i + 1}. {f.name}
                  </Typography>
                ))}
              </Box>
            )}
            {mode === 1 && outputVideoUrl && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', mb: 1 }}>
                  Slideshow preview
                </Typography>
                <Box sx={{ borderRadius: '12px', overflow: 'hidden', bgcolor: '#000', maxWidth: 720 }}>
                  <video controls src={outputVideoUrl} style={{ width: '100%', display: 'block' }} />
                </Box>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <SoundtrackPickerSection
                {...soundtrack}
                dryAudioUrl={dryMediaUrl}
                docId={resultDocId}
                source="slideshow"
                userId={userId}
                onApplied={(url) => setOutputVideoUrl(url)}
                applyLabel="Save slideshow with soundtrack"
              />
            </Box>
          </Box>
        )}

        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
            {mode === 1 ? 'Narration per slide' : 'Narration script'}
          </Typography>
          {blocks.map((block, index) => (
            <Box
              key={block.id}
              sx={{
                py: 2,
                borderBottom: '1px solid #ececec',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#999' }}>
                  Block {index + 1}
                  {mode === 1 && imageFiles[index] ? ` · ${imageFiles[index].name}` : ''}
                </Typography>
                {blocks.length > 1 && (
                  <IconButton size="small" onClick={() => removeBlock(block.id)} sx={{ color: '#999' }}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <TextField
                multiline
                minRows={3}
                placeholder={mode === 1 ? 'Narration for this slide…' : 'Enter narration script…'}
                value={block.text}
                onChange={(e) => {
                  updateBlock(block.id, { text: e.target.value });
                  if (e.target.value.trim() && workflowStep < 1) setWorkflowStep(1);
                }}
                fullWidth
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& .MuiInputBase-root': { fontSize: '0.9375rem', lineHeight: 1.6 },
                }}
              />
            </Box>
          ))}
        </Box>

        <ElevenLabsButton
          variant="outlined"
          startIcon={<Add />}
          onClick={addBlock}
          sx={{ mt: 2, alignSelf: 'flex-start' }}
        >
          Add block
        </ElevenLabsButton>

        <StudioHistorySection sourceId="voiceover" />
      </StudioPageShell>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'fixed', bottom: 88, right: 24, zIndex: 9999, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
    </>
  );
}
