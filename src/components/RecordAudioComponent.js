import React, { useState, useRef, useEffect } from 'react';
import {
  Button, Select, MenuItem, FormControl, InputLabel,
  Box, Grid, Snackbar, Alert, Typography, useTheme, Stack
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LanguageIcon from '@mui/icons-material/Language';
import WaveSurfer from 'wavesurfer.js';
import { transcriptionAPI, checkUsageBeforeRequest, handleAPIError } from '../services/api';
import { AvoicesProgress, AvoicesBackdropLoader } from './progress';

const languageOptions = [
  { label: 'English',     value: 'en' },
  { label: 'Ateso',       value: 'at' },
  { label: 'Acholi',      value: 'ac' },
  { label: 'Swahili',     value: 'sw' },
  { label: 'Runyankore',  value: 'nyn' },
  { label: 'Kinyarwanda', value: 'rw' },
  { label: 'French',      value: 'fr' },
];

const GLASS = { background: 'rgba(17, 17, 17,0.03)', border: '1px solid rgba(17, 17, 17,0.07)', borderRadius: '20px' };
const G = 'linear-gradient(135deg, #E8A020, #C47F10)';

const RecordAudioComponent = () => {
  const theme = useTheme();
  const [language, setLanguage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const waveformRef = useRef(null);
  const mediaRecorder = useRef(null);

  useEffect(() => {
    if (!waveformRef.current) return;
    
    const waveSurferInstance = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(17, 17, 17, 0.1)',
      progressColor: '#E8A020',
      cursorColor: '#E8A020',
      barWidth: 2,
      responsive: true,
      height: 80,
      barRadius: 3,
      normalize: true,
    });

    waveSurferInstance.on('play', () => setIsPlaying(true));
    waveSurferInstance.on('pause', () => setIsPlaying(false));
    setWaveSurfer(waveSurferInstance);

    return () => waveSurferInstance.destroy();
  }, []);

  const handleRecordingStart = async () => {
    if (!language) {
      setBannerMessage('Please select a language before recording');
      setShowBanner(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (waveSurfer) waveSurfer.loadBlob(blob);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
    } catch {
      setBannerMessage('Error accessing microphone');
      setShowBanner(true);
    }
  };

  const handleRecordingStop = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayPause = () => waveSurfer && waveSurfer.playPause();

  const handleDiscardRecording = () => {
    setAudioBlob(null);
    if (waveSurfer) waveSurfer.empty();
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      await checkUsageBeforeRequest('upload_recorded_audio');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.uid && !user.userId) throw new Error('User not authenticated');
      await transcriptionAPI.uploadRecordedAudio(audioBlob, language, user.uid || user.userId);
      setBannerMessage('Recording uploaded successfully!');
      handleDiscardRecording();
    } catch (error) {
      const errorInfo = handleAPIError(error, 'upload_recorded_audio');
      if (errorInfo.shouldUpgrade) {
        setBannerMessage('Buy credits to continue — your wallet balance is too low.');
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', { detail: { message: errorInfo.message } }));
      } else {
        setBannerMessage(errorInfo.message || 'Upload failed. Please try again.');
      }
    } finally {
      setShowBanner(true);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ ...GLASS, p: { xs: 2.5, md: 4 }, position: 'relative', overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
          <AvoicesProgress variant="indeterminate" size="xs" sx={{ borderRadius: '20px 20px 0 0' }} />
        </Box>
      )}

      <AvoicesBackdropLoader open={loading} message="Uploading Audio…" submessage="Please wait while we process your recording." />

      <Snackbar open={showBanner} autoHideDuration={6000} onClose={() => setShowBanner(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setShowBanner(false)} severity={bannerMessage.includes('successfully') ? 'success' : 'error'} sx={{ width: '100%', borderRadius: '12px' }}>
          {bannerMessage}
        </Alert>
      </Snackbar>

      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#111111', letterSpacing: '-0.02em' }}>
            Neural <span style={{ color: '#E8A020' }}>Recording Studio</span>
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(17, 17, 17,0.3)', fontWeight: 500 }}>
            Capture high-fidelity audio for instant transcription
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { color: '#111111', '& fieldset': { borderColor: 'rgba(17, 17, 17, 0.1)' }, '&:hover fieldset': { borderColor: 'rgba(232, 160, 32, 0.4)', transition: '0.2s' }, '&.Mui-focused fieldset': { borderColor: '#E8A020' } }, '& .MuiInputLabel-root': { color: 'rgba(17, 17, 17, 0.4)', '&.Mui-focused': { color: '#E8A020' } } }}>
            <InputLabel id="language-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LanguageIcon fontSize="small" />
                Select Language
              </Box>
            </InputLabel>
            <Select 
              labelId="language-label" 
              label="Select Language"
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              sx={{ borderRadius: '12px' }}
            >
              {languageOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              onClick={isRecording ? handleRecordingStop : handleRecordingStart}
              startIcon={isRecording ? <StopIcon /> : <MicIcon />}
              sx={{ 
                py: 2, px: 6, borderRadius: '50px', fontWeight: 800,
                background: isRecording ? '#f43f5e' : G,
                boxShadow: isRecording ? '0 0 20px rgba(244,63,94,0.3)' : '0 0 20px rgba(232, 160, 32,0.3)',
                '&:hover': { background: isRecording ? '#e11d48' : G, transform: 'translateY(-2px)', transition: '0.2s' }
              }}
            >
              {isRecording ? 'STOP CAPTURE' : 'START RECORDING'}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ p: 3, background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(17, 17, 17, 0.05)' }}>
            <Box ref={waveformRef} sx={{ mb: 3, opacity: isRecording ? 1 : 0.4 }} />
            {audioBlob && (
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Button variant="outlined" onClick={handlePlayPause} startIcon={isPlaying ? <StopIcon /> : <PlayArrowIcon />} 
                  sx={{ borderRadius: '50px', borderColor: 'rgba(17, 17, 17, 0.1)', color: '#111111', '&:hover': { borderColor: '#E8A020' } }}>
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </Button>
                <Button variant="outlined" color="error" onClick={handleDiscardRecording} startIcon={<DeleteOutlineIcon />} 
                  sx={{ borderRadius: '50px', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', '&:hover': { background: 'rgba(244,63,94,0.05)', borderColor: '#f43f5e' } }}>
                  DISCARD
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={<CloudUploadIcon />} 
                  sx={{ borderRadius: '50px', background: '#10b981', fontWeight: 700, '&:hover': { background: '#059669' } }}>
                  SAVE & PROCESS
                </Button>
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecordAudioComponent;
