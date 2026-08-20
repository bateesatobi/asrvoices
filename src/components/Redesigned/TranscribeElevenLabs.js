import React, { useState } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Mic } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  ElevenLabsButton,
  ElevenLabsFileUpload,
  SettingSelect,
  ElevenLabsSettingsPanel,
  SettingSection,
  PropertySection,
  PropertyRow,
} from '../ElevenLabsUI';
import StudioPageShell from '../Layout/StudioPageShell';
import StudioHistorySection from '../Layout/StudioHistorySection';
import { STUDIO_VISUALS } from '../../data/studioVisuals';
import { transcriptionAPI, videoAPI, getFriendlyErrorMessage } from '../../services/api';
import { registerTrackedJob } from '../../hooks/useBackgroundJobs';
import { transcriptionResultPathForMedia } from '../../utils/transcriptionRoutes';
import { LANGUAGES } from '../../constants/languages';
import useStudioUser from '../../hooks/useStudioUser';
import { StudioJobProgressBar } from '../progress';

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Plain text' },
  { value: 'srt', label: 'SRT subtitles' },
  { value: 'vtt', label: 'WebVTT' },
];

export default function TranscribeElevenLabs() {
  const navigate = useNavigate();
  const { userId, balance, refreshBalance } = useStudioUser();

  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [responseFormat, setResponseFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const handleTranscribe = async () => {
    if (!selectedFile || !userId) return;
    setLoading(true);
    try {
      const isVideo = selectedFile.type?.startsWith('video/');
      const res = isVideo
        ? await videoAPI.extractAudioFromVideo(selectedFile, sourceLang, userId, responseFormat)
        : await transcriptionAPI.uploadAudio(selectedFile, sourceLang, userId, responseFormat);

      const jobId = res.job_id || res.doc_id;
      const isAsync = res.status === 'processing' || res.status === 'queued' || Boolean(jobId && !res.audio_link);

      if (jobId) {
        registerTrackedJob(jobId, res.status || 'processing', {
          mediaType: isVideo ? 'video' : 'audio',
        });
      }

      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));

      if (isAsync) {
        setSnack({
          open: true,
          msg: res.message || "Transcription started — you can keep working. We'll notify you when it's done.",
          sev: 'success',
        });
        setSelectedFile(null);
        return;
      }

      setSnack({ open: true, msg: 'Transcription completed!', sev: 'success' });
      setSelectedFile(null);

      const resultDocId = res.doc_id || res.job_id;
      if (resultDocId) {
        const path = transcriptionResultPathForMedia(resultDocId, isVideo ? 'video' : 'audio');
        setTimeout(() => navigate(path), 800);
      }
    } catch (error) {
      setSnack({ open: true, msg: getFriendlyErrorMessage(error), sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Transcription">
        <SettingSelect
          label="Source language"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
        />
        <SettingSelect
          label="Output format"
          value={responseFormat}
          onChange={(e) => setResponseFormat(e.target.value)}
          options={FORMAT_OPTIONS}
        />
      </SettingSection>
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credits" value={balance !== null ? balance.toFixed(2) : '…'} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3 }}>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          size="large"
          loading={loading}
          disabled={!selectedFile}
          onClick={handleTranscribe}
        >
          Transcribe
        </ElevenLabsButton>
      </Box>
    </ElevenLabsSettingsPanel>
  );

  return (
    <>
      <StudioPageShell
        data-tour="transcribe-header"
        icon={<Mic sx={{ fontSize: 22 }} />}
        title="Speech to text"
        subtitle="Upload audio or video — we extract speech and return a transcript"
        settingsContent={settingsContent}
        hideHeader
        hero={{
          image: STUDIO_VISUALS.transcribe.image,
          title: 'Speech to text',
          subtitle: 'Drop a recording onto the studio still — history stays a list below.',
          height: 280,
          children: (
            <Box
              data-tour="transcribe-upload"
              sx={{
                mt: 2,
                borderRadius: '14px',
                bgcolor: 'rgba(255,255,255,0.94)',
                p: { xs: 2, md: 2.5 },
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Drop audio or video here
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#666', mb: 1.5 }}>
                MP3, WAV, MP4, MOV — up to 500MB
              </Typography>
              <ElevenLabsFileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onClearFile={() => setSelectedFile(null)}
                accept="audio/*,video/*"
              />
            </Box>
          ),
        }}
      >
        <StudioJobProgressBar
          open={loading}
          message="Transcribing…"
          submessage="Extracting speech from your audio or video"
        />

        <StudioHistorySection sourceId="transcription" />
      </StudioPageShell>

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
