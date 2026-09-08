import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Grid, FormControl, Select, Button, Snackbar, Alert,
  MenuItem, Chip, Drawer, InputLabel, Stack
} from '@mui/material';
import { CloudUpload, Send, CheckCircle } from '@mui/icons-material';
import { voiceToVoiceAPI, subscriptionAPI, getFriendlyErrorMessage } from '../services/api';
import { LANGUAGES } from '../constants/languages';
import { ASR_LANGUAGES, DEFAULT_ASR_LANG } from '../constants/asrLanguages';
import ViewVoxComponent from './ViewVoxComponent';
import { ActivityStrip, AvoicesBackdropLoader } from './progress';

const G = 'linear-gradient(135deg, #E8A020, #C47F10)';
const SELECT_SX = {
  borderRadius: '12px', color: '#111111', fontSize: '0.9rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 17, 17, 0.1)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E8A020' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E8A020' },
  '& .MuiSvgIcon-root': { color: 'rgba(17, 17, 17, 0.5)' },
};
const LABEL_SX = { color: 'rgba(17, 17, 17, 0.5)', '&.Mui-focused': { color: '#E8A020' } };

// 2 credits per MB rule-based estimation
const VOICE_TO_VOICE_RATE = 2;

export default function SpeechToSpeechForm() {
  const [sourceLang, setSourceLang] = useState(DEFAULT_ASR_LANG);
  const [targetLangs, setTargetLangs] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voiceId, setVoiceId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [userBalance, setUserBalance] = useState(null);

  const fileRef = useRef(null);
  const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');
  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  useEffect(() => {
    const user = getUser();
    const userId = user.uid || user.userId;
    if (userId) {
      subscriptionAPI.getBalance(userId)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      setEstimatedCost(Math.round(Math.max(fileSizeMB, 0.5) * VOICE_TO_VOICE_RATE * 100) / 100);
    } else {
      setEstimatedCost(0);
    }
  }, [file]);

  const isLowBalance = userBalance !== null && userBalance < estimatedCost;

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { notify('File must be under 100MB', 'error'); return; }
    if (!f.type.startsWith('audio/')) { notify('Please upload an audio file', 'error'); return; }
    setFile(f);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!targetLangs.length) { notify('Select at least one target language', 'error'); return; }
    if (!file) { notify('Please upload an audio file', 'error'); return; }
    setLoading(true);
    try {
      const { uid, userId } = getUser();
      const id = uid || userId;
      if (!id) { notify('Please log in again', 'error'); return; }
      const res = await voiceToVoiceAPI.voiceToVoice(file, sourceLang, targetLangs, id);
      setVoiceId(res.doc_id || res.voiceId);
      
      // Refresh balance
      subscriptionAPI.getBalance(id)
        .then(data => {
          setUserBalance(data.balance ?? data.credit_balance ?? null);
          window.dispatchEvent(new CustomEvent('refresh-balance'));
        })
        .catch(() => {});
        
      setDrawerOpen(true);
      notify('Voice translation completed!');
    } catch (e) {
      if (e.response?.status === 402) {
        window.dispatchEvent(new CustomEvent('subscription-limit-exceeded', {
          detail: { message: e.response?.data?.detail || 'Insufficient credits.', status: 402 }
        }));
        notify(e.response?.data?.detail || 'Insufficient credits for voice translation.', 'error');
      } else {
        notify(getFriendlyErrorMessage(e, 'Translation failed. Please try again.'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Language selectors */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={LABEL_SX}>Source Language</InputLabel>
            <Select value={sourceLang} label="Source Language" onChange={e => setSourceLang(e.target.value)} sx={SELECT_SX}>
              {ASR_LANGUAGES.map(l => <MenuItem key={l.value} value={l.value} sx={{ color: '#111111', '&:hover': { color: '#E8A020' } }}>{l.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={LABEL_SX}>Target Languages</InputLabel>
            <Select
              multiple value={targetLangs} label="Target Languages"
              onChange={e => setTargetLangs(e.target.value)} sx={SELECT_SX}
              renderValue={sel => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {sel.map(v => (
                    <Chip key={v} label={LANGUAGES.find(l => l.value === v)?.label || v} size="small"
                      sx={{ background: 'rgba(232, 160, 32,0.2)', color: '#F5B844', fontSize: '0.72rem', borderRadius: '50px' }} />
                  ))}
                </Box>
              )}
            >
              {LANGUAGES.map(l => <MenuItem key={l.value} value={l.value} sx={{ color: '#111111', '&:hover': { color: '#E8A020' } }}>{l.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Upload zone */}
      <input ref={fileRef} type="file" accept="audio/*" hidden onChange={handleFile} />
      <Box
        onClick={() => fileRef.current?.click()}
        sx={{
          border: '1.5px dashed',
          borderColor: file ? '#10b981' : 'rgba(17, 17, 17,0.12)',
          borderRadius: '14px', p: 4, textAlign: 'center', cursor: 'pointer',
          background: file ? 'rgba(16,185,129,0.05)' : 'rgba(17, 17, 17,0.02)',
          mb: 3, transition: 'all 0.25s ease',
          '&:hover': { borderColor: '#E8A020', background: 'rgba(232, 160, 32,0.04)', transform: 'scale(1.005)' },
        }}
      >
        {file ? (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 22 }} />
            <Box sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</Box>
          </Stack>
        ) : (
          <>
            <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(232, 160, 32,0.1)', border: '1px solid rgba(232, 160, 32,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <CloudUpload sx={{ fontSize: 26, color: '#C47F10' }} />
            </Box>
            <Box sx={{ color: '#111111', fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>Click to upload audio file</Box>
            <Box sx={{ color: '#64748b', fontSize: '0.8rem' }}>WAV, MP3, M4A · Max 100MB</Box>
          </>
        )}
      </Box>

      <ActivityStrip active={loading} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        {/* Removed local cost estimator to prioritize global navbar balance */}
        <Button
          variant="contained" size="large" onClick={handleSubmit}
          disabled={loading || !file || !targetLangs.length || isLowBalance}
          startIcon={<Send />}
          sx={{
            borderRadius: '50px', textTransform: 'none', fontWeight: 700, px: 4, py: 1.3,
            background: G, boxShadow: '0 4px 20px rgba(232, 160, 32,0.35)',
            '&:hover': { background: 'linear-gradient(135deg,#0284c7,#7c3aed)', boxShadow: '0 6px 28px rgba(232, 160, 32,0.5)', transform: 'translateY(-1px)' },
            '&.Mui-disabled': { background: 'rgba(17, 17, 17, 0.08)', color: 'rgba(17, 17, 17,0.3)', boxShadow: 'none' },
          }}
        >
          {loading ? 'Processing…' : isLowBalance ? 'Insufficient Credits' : 'Translate Voice'}
        </Button>
      </Box>

      <AvoicesBackdropLoader open={loading} message="Processing Voice Translation…" submessage="Converting and generating your new audio." />

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, borderLeft: '1px solid rgba(17, 17, 17,0.07)' } }}>
        {voiceId && <ViewVoxComponent voiceId={voiceId} />}
      </Drawer>
    </Box>
  );
}
