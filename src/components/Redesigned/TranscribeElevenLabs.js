import React, { useState } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Mic, CloudUpload } from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
        showPropertiesPanel={!isMobile}
      >
        <StudioJobProgressBar
          open={loading}
          message="Transcribing…"
          submessage="Extracting speech from your audio or video"
        />
        <Box
          data-tour="transcribe-upload"
          sx={{
            border: selectedFile ? '2px solid #E8A020' : '2px dashed #e8e8e8',
            borderRadius: '16px',
            bgcolor: selectedFile ? 'rgba(232,160,32,0.04)' : '#fafafa',
            p: { xs: 3, md: 5 },
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              bgcolor: 'rgba(232,160,32,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CloudUpload sx={{ fontSize: 28, color: '#E8A020' }} />
          </Box>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
            Drop audio or video here
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#666', mb: 2 }}>
            MP3, WAV, MP4, MOV — up to 500MB, 2–3+ hours supported
          </Typography>
          <ElevenLabsFileUpload
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClearFile={() => setSelectedFile(null)}
            accept="audio/*,video/*"
          />
        </Box>

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
