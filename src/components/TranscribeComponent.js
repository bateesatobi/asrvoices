import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Snackbar, Alert,
  FormControl, Select, MenuItem, IconButton, Tab, Tabs,
  Drawer, InputLabel, Stack,
  Stepper, Step, StepLabel, StepContent, Paper,
  Chip,
} from '@mui/material';
import {
  CloudUpload, Mic, Stop, PlayArrow, Pause,
  CheckCircle, CheckCircleOutline, DeleteOutline,
  AutoAwesome, SettingsVoice,
} from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';
import { transcriptionAPI, subscriptionAPI, getFriendlyErrorMessage } from '../services/api';
import { ASR_LANGUAGES, DEFAULT_ASR_LANG, getAsrLanguageLabel } from '../constants/asrLanguages';
import LiveTranscribePanel from './Redesigned/LiveTranscribePanel';
import ViewAudioComponent from './ViewAudioComponent';
import UpgradePromptModal from './UpgradePromptModal';
import { AC, G, GLASS, STEPPER_SX } from '../utils/mediaVault';
import { AvoicesBackdropLoader } from './progress';
import useFileDrop from '../hooks/useFileDrop';
import { UsageTip, useStudioTour } from './onboarding';
import { TOUR_IDS, transcribeTour } from './onboarding/tours';
const SELECT_SX = {
  bgcolor: '#fafafa',
  borderRadius: '8px',
  fontSize: '0.875rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8e8e8' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1a1a1a', borderWidth: '2px' },
};
const LABEL_SX = { 
  color: '#666666',
  fontSize: '0.875rem',
  '&.Mui-focused': { color: '#1a1a1a' } 
};

const MAX_FILE_MB = 500;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON (Simple)', desc: 'Concise text-only JSON' },
  { value: 'text', label: 'Plain Text', desc: 'Raw unformatted text' },
  { value: 'srt', label: 'SRT (Subtitles)', desc: 'Standard SubRip format' },
  { value: 'verbose_json', label: 'Verbose JSON', desc: 'Detailed with timestamps' },
  { value: 'vtt', label: 'WebVTT', desc: 'Modern web subtitle format' },
];

function StepNav({ onBack, onNext, backDisabled, nextDisabled, nextLabel = 'Next' }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Button 
        disabled={backDisabled} 
        onClick={onBack} 
        sx={{ 
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          color: '#666',
          border: '1px solid #e8e8e8',
          '&:hover': { bgcolor: '#fafafa', borderColor: '#d0d0d0' }
        }}
      >
        Back
      </Button>
      <Button 
        variant="contained" 
        onClick={onNext} 
        disabled={nextDisabled} 
        sx={{ 
          background: '#1a1a1a',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { background: '#333', boxShadow: 'none' }
        }}
      >
        {nextLabel}
      </Button>
    </Stack>
  );
}

export default function TranscribeComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [sourceLang, setSourceLang] = useState(DEFAULT_ASR_LANG);
  const [responseFormat, setResponseFormat] = useState('json');
  const [file, setFile] = useState(null);
  const [blob, setBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [upgradeModal, setUpgradeModal] = useState({ open: false, data: null });
  const [userBalance, setUserBalance] = useState(null);

  const recorder = useRef(null);
  const stream = useRef(null);
  const player = useRef(null);
  const fileInput = useRef(null);

  useStudioTour(TOUR_IDS.transcribe, transcribeTour);

  const selectFile = (f) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setSnack({ open: true, msg: `File is too large (${(f.size / (1024 * 1024)).toFixed(1)} MB). Max ${MAX_FILE_MB} MB.`, sev: 'error' });
      return;
    }
    setFile(f);
  };

  const { isDragOver, dropProps } = useFileDrop(
    files => selectFile(files[0]),
    { accept: ['audio/', 'video/'], multiple: false, disabled: loading },
  );

  const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');
  const isLowBalance = false; // balance check handled server-side

  const tabLabels = ['Upload File', 'Record Audio', 'Live microphone'];
  const hasContent = tab === 0 ? !!file : tab === 1 ? !!blob : true;

  useEffect(() => {
    const user = getUser();
    const userId = user.uid || user.userId;
    if (userId) {
      subscriptionAPI.getBalance(userId)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, []);

  useEffect(() => () => {
    stream.current?.getTracks().forEach(t => t.stop());
    if (audioURL) URL.revokeObjectURL(audioURL);
  }, [audioURL]);

  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const handleTabChange = (_, v) => {
    setTab(v);
    setActiveStep(0);
    setSuccessMsg(null);
    setDocId(null);
  };

  const handleNext = () => setActiveStep(s => s + 1);
  const handleBack = () => setActiveStep(s => Math.max(0, s - 1));
  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setBlob(null);
    discardRecording();
    setDocId(null);
    setSuccessMsg(null);
  };

  const loadDemoAudio = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://res.cloudinary.com/demo/video/upload/dog.mp3');
      const demoBlob = await response.blob();
      setFile(new File([demoBlob], 'demo_audio.mp3', { type: 'audio/mp3' }));
    } catch {
      notify('Failed to load demo audio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recorder.current?.stop();
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      setIsRecording(false);
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.current = s;
        const chunks = [];
        const mr = new MediaRecorder(s);
        mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);
        mr.onstop = () => {
          const b = new Blob(chunks, { type: 'audio/webm' });
          if (b.size > 0) { setBlob(b); setAudioURL(URL.createObjectURL(b)); }
          else notify('No audio recorded', 'warning');
        };
        mr.start(1000);
        recorder.current = mr;
        setIsRecording(true);
      } catch {
        notify('Microphone access denied', 'error');
      }
    }
  };

  const discardRecording = () => {
    stream.current?.getTracks().forEach(t => t.stop());
    if (audioURL) URL.revokeObjectURL(audioURL);
    setBlob(null);
    setAudioURL(null);
    setIsPlaying(false);
    if (player.current) player.current.pause();
  };

  const togglePlay = () => {
    if (!player.current || !audioURL) return;
    if (isPlaying) { player.current.pause(); setIsPlaying(false); }
    else { player.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  const handleSubmit = async () => {
    if (!hasContent) {
      notify(tab === 0 ? 'Please select a file' : 'Please record audio first', 'error');
      return;
    }
    setLoading(true);
    setDocId(null);
    setSuccessMsg(null);
    try {
      const { uid, userId } = getUser();
      const id = uid || userId;
      if (!id) { notify('Please log in again', 'error'); return; }

      let res;
      if (tab === 0) {
        res = await transcriptionAPI.uploadAudio(file, sourceLang, id, responseFormat);
      } else {
        res = await transcriptionAPI.uploadRecordedAudio(blob, sourceLang, id, responseFormat);
      }

      setDocId(res.doc_id);
      subscriptionAPI.getBalance(id).then(data => {
        setUserBalance(data.balance ?? data.credit_balance ?? null);
        window.dispatchEvent(new CustomEvent('refresh-balance'));
      }).catch(() => {});
      setSuccessMsg('Transcription completed successfully!');
      setActiveStep(3);
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      if (!e?.shouldUpgrade) {
        notify(getFriendlyErrorMessage(e, 'Transcription failed. Please try again.'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInputStep = () => {
    if (tab === 0) {
      return (
        <>
          <input ref={fileInput} type="file" accept="audio/*,video/*" hidden onChange={e => { selectFile(e.target.files[0]); e.target.value = ''; }} />
          <Box onClick={() => fileInput.current?.click()} {...dropProps} sx={{
            p: 4, textAlign: 'center', cursor: 'pointer',
            border: '2px dashed',
            borderRadius: '12px',
            borderColor: isDragOver || file ? AC : '#e8e8e8',
            background: isDragOver ? 'rgba(232,160,32,0.04)' : file ? 'rgba(232,160,32,0.04)' : '#fafafa',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: AC, background: 'rgba(232,160,32,0.04)' },
          }}>
            {file ? (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                <CheckCircle sx={{ color: AC, fontSize: 22 }} />
                <Typography sx={{ color: AC, fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</Typography>
              </Stack>
            ) : (
              <>
                <Box sx={{ width: 60, height: 60, borderRadius: '12px', background: 'rgba(232,160,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <CloudUpload sx={{ fontSize: 32, color: AC }} />
                </Box>
                <Typography sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.9375rem', mb: 0.5 }}>
                  Click or drag file here to upload
                </Typography>
                <Typography sx={{ color: '#666', fontSize: '0.8125rem', mb: 2 }}>
                  Audio & video files, up to {MAX_FILE_MB}MB
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={e => { e.stopPropagation(); loadDemoAudio(); }} 
                  disabled={loading} 
                  sx={{ 
                    borderRadius: '8px',
                    borderColor: '#e8e8e8',
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#d0d0d0', bgcolor: '#fafafa' }
                  }}
                >
                  {loading ? 'Loading…' : 'Try Demo Audio'}
                </Button>
              </>
            )}
          </Box>
        </>
      );
    }
    if (tab === 1) {
      return (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button
              variant={isRecording ? 'contained' : 'outlined'}
              startIcon={isRecording ? <Stop /> : <Mic />}
              onClick={toggleRecording}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 3,
                ...(isRecording
                  ? { background: '#ef4444', color: '#fff', '&:hover': { background: '#dc2626' } }
                  : { borderColor: '#e8e8e8', color: '#666', '&:hover': { background: '#fafafa', borderColor: '#d0d0d0' } }),
              }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {isRecording && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                <Typography sx={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700 }}>Recording…</Typography>
              </Stack>
            )}
            {audioURL && !isRecording && (
              <>
                <Button variant="outlined" size="small" startIcon={isPlaying ? <Pause /> : <PlayArrow />} onClick={togglePlay} sx={{ borderRadius: '10px', fontWeight: 700, borderColor: 'rgba(17,17,17,0.15)' }}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <IconButton onClick={discardRecording} size="small" sx={{ color: '#ef4444' }}><DeleteOutline fontSize="small" /></IconButton>
                <audio ref={player} src={audioURL} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
              </>
            )}
          </Stack>
          {!blob && !isRecording && (
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(17,17,17,0.45)', fontWeight: 600 }}>Use your microphone to capture audio for transcription.</Typography>
          )}
        </Stack>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: '100vh', background: 'transparent', maxWidth: 1200, mx: 'auto' }}>

      <AvoicesBackdropLoader open={loading} message="Transcribing audio…" submessage="Extracting speech and formatting your transcript" />

      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>{successMsg}</Alert>}

      <Box data-tour="studio-mode" sx={{ mb: 3, borderBottom: '1px solid #e8e8e8' }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          variant={isMobile ? 'fullWidth' : 'standard'} 
          sx={{ 
            minHeight: 48,
            '& .MuiTabs-indicator': { background: '#1a1a1a', height: 2 } 
          }}
        >
          {[
            { label: 'Upload', icon: <CloudUpload sx={{ fontSize: 18 }} /> },
            { label: 'Record', icon: <Mic sx={{ fontSize: 18 }} /> },
            { label: 'Live', icon: <SettingsVoice sx={{ fontSize: 18 }} /> },
          ].map(({ label, icon }, i) => (
            <Tab 
              key={i} 
              label={!isMobile ? tabLabels[i] : label} 
              icon={icon} 
              iconPosition="start" 
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                py: 2,
                px: 2.5,
                color: tab === i ? '#1a1a1a' : '#666',
                '&.Mui-selected': { color: '#1a1a1a' },
                '&:hover': { color: '#1a1a1a', bgcolor: 'rgba(0,0,0,0.02)' },
                '& .MuiTab-iconWrapper': { mr: 1 },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {tab === 2 ? (
        <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS }}>
          <FormControl fullWidth size="small" sx={{ mb: 2, maxWidth: 360 }}>
            <InputLabel sx={LABEL_SX}>Source Language</InputLabel>
            <Select value={sourceLang} label="Source Language" onChange={e => setSourceLang(e.target.value)} sx={SELECT_SX}>
              {ASR_LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
            </Select>
          </FormControl>
          <LiveTranscribePanel language={sourceLang} />
        </Paper>
      ) : (
      <Stepper data-tour="studio-flow" activeStep={activeStep} orientation="vertical" sx={STEPPER_SX}>

        <Step>
          <StepLabel>Step 1: {tab === 0 ? 'Upload Media' : 'Record Audio'}</StepLabel>
          <StepContent>
            <Paper data-tour="studio-input" elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 2, fontWeight: 600 }}>
                Provide the {tab === 0 ? 'audio or video file' : 'recording'} you want to transcribe.
              </Typography>
              {renderInputStep()}
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={activeStep === 0} nextDisabled={!hasContent} />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 2: Language & Output Format</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#111111' }}>Output settings</Typography>
                <UsageTip title="Language: the language spoken in your media — this drives accuracy. Format: JSON for apps, Plain Text to read, SRT/VTT for subtitles, Verbose JSON for word-level timestamps." />
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={LABEL_SX}>Source Language</InputLabel>
                    <Select value={sourceLang} label="Source Language" onChange={e => setSourceLang(e.target.value)} sx={SELECT_SX}>
                      {ASR_LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={LABEL_SX}>Response Format</InputLabel>
                    <Select value={responseFormat} label="Response Format" onChange={e => setResponseFormat(e.target.value)} sx={SELECT_SX}>
                      {FORMAT_OPTIONS.map(f => (
                        <MenuItem key={f.value} value={f.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(17,17,17,0.5)' }}>{f.desc}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={false} />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 3: Review & Transcribe</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack spacing={1.5} sx={{ p: 2, background: 'rgba(232,160,32,0.05)', borderRadius: '12px', border: `1px solid ${AC}30`, mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Mode:</strong> {tabLabels[tab]}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Language:</strong> {getAsrLanguageLabel(sourceLang)}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Format:</strong> {FORMAT_OPTIONS.find(f => f.value === responseFormat)?.label}</Typography>
                {tab === 0 && file && <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>File:</strong> {file.name}</Typography>}
                {tab === 1 && blob && <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Recording:</strong> Ready</Typography>}
              </Stack>
              <Button
                variant="contained" fullWidth startIcon={<AutoAwesome />}
                onClick={handleSubmit}
                disabled={loading || !hasContent || isLowBalance}
                sx={{ 
                  background: '#1a1a1a',
                  color: '#ffffff',
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { background: '#333', boxShadow: 'none' },
                  '&:disabled': { background: '#e8e8e8', color: '#999' }
                }}
              >
                {loading ? 'Processing…' : isLowBalance ? 'Insufficient Credits' : 'Start Transcription'}
              </Button>
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={!docId} nextLabel="View Results" />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 4: View & Edit Transcript</StepLabel>
          <StepContent>
            {docId ? (
              <Box sx={{ mb: 2, mt: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, px: 0.5 }}>
                  <CheckCircleOutline sx={{ color: '#10b981', fontSize: 22 }} />
                  <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem' }}>
                    Transcription complete — review and edit below
                  </Typography>
                </Stack>
                <ViewAudioComponent
                  audioId={docId}
                  embedded
                  onError={e => notify(getFriendlyErrorMessage(e), 'error')}
                />
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={handleBack} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Back</Button>
                  <Button variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ borderRadius: '12px', fontWeight: 800, px: 3, borderColor: `${AC}66`, color: AC }}>Open in panel</Button>
                  <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Start Over</Button>
                </Stack>
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 4, mb: 2, ...GLASS, mt: 1, textAlign: 'center' }}>
                <Typography sx={{ color: 'rgba(17,17,17,0.4)', mb: 3 }}>Complete Step 3 to generate a transcript.</Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="outlined" onClick={handleBack} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Back</Button>
                  <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Start Over</Button>
                </Stack>
              </Paper>
            )}
          </StepContent>
        </Step>

      </Stepper>
      )}

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '12px' }}>{snack.msg}</Alert>
      </Snackbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, borderLeft: '1px solid rgba(17,17,17,0.07)' } }}>
        {docId && <ViewAudioComponent audioId={docId} onError={e => { notify(getFriendlyErrorMessage(e), 'error'); setDrawerOpen(false); }} />}
      </Drawer>

      <UpgradePromptModal open={upgradeModal.open} onClose={() => setUpgradeModal({ open: false, data: null })}
        currentUsage={upgradeModal.data?.currentUsage || 0} limit={upgradeModal.data?.limit || 0}
        endpoint="upload" tier={upgradeModal.data?.tier || 'free_trial'} />
    </Box>
  );
}
