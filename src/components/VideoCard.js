import React, { useState, useEffect, useRef } from "react";
import useFileDrop from "../hooks/useFileDrop";
import {
  TextField, Button, Select, MenuItem, FormControl,
  Box, Alert, Snackbar, Drawer, Tab, Tabs, Grid,
  InputLabel, Stack, Typography,
} from "@mui/material";
import { CloudUpload, VideoCall, CheckCircle, Link as LinkIcon } from "@mui/icons-material";
import ViewVideoComponent from "./ViewVideoComponent";
import { videoAPI, checkUsageBeforeRequest, handleAPIError, BASE_URL } from '../services/api';
import { ActivityStrip } from './progress';

const G = 'linear-gradient(135deg, #E8A020, #C47F10)';
const SELECT_SX = {
  borderRadius: '12px', color: '#111111', fontSize: '0.9rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 17, 17, 0.1)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E8A020' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E8A020' },
  '& .MuiSvgIcon-root': { color: 'rgba(17, 17, 17, 0.5)' },
};
const LABEL_SX = { color: 'rgba(17, 17, 17, 0.5)', '&.Mui-focused': { color: '#E8A020' } };

const languageOptions = [
  { value: "en",  label: "English",    flag: "🇺🇸" },
  { value: "lg",  label: "Luganda",    flag: "🇺🇬" },
  { value: "at",  label: "Ateso",      flag: "🇺🇬" },
  { value: "ac",  label: "Acholi",     flag: "🇺🇬" },
  { value: "sw",  label: "Swahili",    flag: "🇰🇪" },
  { value: "fr",  label: "French",     flag: "🇫🇷" },
  { value: "rw",  label: "Kinyarwanda", flag: "🇷🇼" },
  { value: "nyn", label: "Runyankore", flag: "🇺🇬" },
];

const VideoCard = () => {
  const [user, setUser] = useState({ username: '', userId: '' });
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [responseFormat, setResponseFormat] = useState("json");
  const [selectedFile, setSelectedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docId, setDocId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const fileInputRef = useRef(null);
  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleFileSelection = (file) => {
    if (file.size > 500 * 1024 * 1024) { setError("File size should not exceed 500MB"); return; }
    if (!file.type.startsWith("video/")) { setError("Please upload a valid video file"); return; }
    setSelectedFile(file);
    setError(null);
    notify('Video file selected successfully');
  };

  const { isDragOver, dropProps } = useFileDrop(
    files => handleFileSelection(files[0]),
    { accept: ['video/'], multiple: false },
  );

  const validateForm = () => {
    if (!sourceLanguage) { setError("Please select a source language"); return false; }
    if (selectedTab === 0 && !selectedFile) { setError("Please select a video file"); return false; }
    if (selectedTab === 1 && !youtubeUrl.trim()) { setError("Please enter a YouTube URL"); return false; }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    setDocId(null);
    setIsDrawerOpen(false);
    try {
      if (!user.userId) throw new Error('Please log in to use video processing services');
      const usageResult = await checkUsageBeforeRequest('videoUpload');
      if (!usageResult.allowed) {
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', { detail: { endpoint: 'videoUpload' } }));
        setLoading(false);
        return;
      }
      const response = selectedTab === 0
        ? await videoAPI.extractAudioFromVideo(selectedFile, sourceLanguage, user.userId, responseFormat)
        : await videoAPI.uploadVideo(youtubeUrl, sourceLanguage, user.userId, responseFormat);
      
      // Handle async response (new) or sync response (backward compatibility)
      if (response.job_id) {
        // New async flow - poll for completion
        await pollJobCompletion(response.job_id);
      } else if (response.doc_id) {
        // Old sync flow - backward compatibility
        setDocId(response.doc_id);
        setIsDrawerOpen(true);
        notify('Video processed successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      if (err.response?.status === 403) window.dispatchEvent(new CustomEvent('show-upgrade-modal'));
    } finally {
      setLoading(false);
    }
  };

  const pollJobCompletion = async (jobId) => {
    const maxWaitMs = 30 * 60 * 1000; // 30 minutes
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const itv = setInterval(async () => {
        if (Date.now() - startedAt > maxWaitMs) {
          clearInterval(itv);
          reject(new Error('Processing timed out. Please try again.'));
          return;
        }
        
        try {
          const response = await fetch(`${BASE_URL}/api/jobs/${jobId}?user_id=${user.userId}`);
          
          if (!response.ok) {
            throw new Error(`Job status check failed: ${response.status}`);
          }
          
          const jobData = await response.json();
          
          if (jobData.status === 'completed') {
            clearInterval(itv);
            const docId = jobData.result?.doc_id;
            
            if (!docId) {
              reject(new Error('Job completed but no doc_id returned'));
              return;
            }
            
            setDocId(docId);
            setIsDrawerOpen(true);
            notify('Video processed successfully!');
            resolve();
          } else if (jobData.status === 'failed') {
            clearInterval(itv);
            reject(new Error(`Processing failed: ${jobData.error || 'Unknown error'}`));
          }
          // Otherwise keep polling
        } catch (err) {
          console.error('Job polling error:', err);
          // Don't stop polling on transient errors
        }
      }, 3000); // Poll every 3 seconds
    });
  };

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ mb: 3, borderBottom: '1px solid rgba(17, 17, 17,0.07)' }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}
          sx={{ minHeight: 40, '& .MuiTabs-indicator': { background: G, height: 2, borderRadius: 1 } }}>
          {[
            { label: 'Upload Video File', icon: <VideoCall sx={{ fontSize: 17 }} /> },
            { label: 'YouTube URL',       icon: <LinkIcon  sx={{ fontSize: 17 }} /> },
          ].map(({ label, icon }, i) => (
            <Tab key={i} label={label} icon={icon} iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 40, color: selectedTab === i ? '#F5B844' : 'rgba(17, 17, 17,0.4)', '&.Mui-selected': { color: '#F5B844' } }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Language and Format selectors */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={LABEL_SX}>Source Language</InputLabel>
            <Select value={sourceLanguage} label="Source Language" onChange={e => setSourceLanguage(e.target.value)} sx={SELECT_SX}>
              {languageOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ color: '#111111', '&:hover': { color: '#E8A020' } }}>{o.flag} {o.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={LABEL_SX}>Response Format</InputLabel>
            <Select value={responseFormat} label="Response Format" onChange={e => setResponseFormat(e.target.value)} sx={SELECT_SX}>
              {[
                { value: 'json', label: 'JSON (Simple)', desc: 'Concise text-only JSON' },
                { value: 'text', label: 'Plain Text', desc: 'Raw unformatted text' },
                { value: 'srt', label: 'SRT (Subtitles)', desc: 'Standard SubRip format' },
                { value: 'verbose_json', label: 'Verbose JSON', desc: 'Detailed with timestamps' },
                { value: 'vtt', label: 'WebVTT', desc: 'Modern web subtitle format' }
              ].map(f => (
                <MenuItem key={f.value} value={f.value} sx={{ color: '#111111', '&:hover': { color: '#E8A020' } }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'inherit' }}>{f.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(17, 17, 17, 0.6)', display: 'block', fontSize: '0.65rem' }}>{f.desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}
          sx={{ mb: 2.5, borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {typeof error === 'string' ? error : error?.message || 'An error occurred'}
        </Alert>
      )}

      {/* Upload or URL */}
      {selectedTab === 0 ? (
        <Box sx={{ mb: 3 }}>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={e => e.target.files[0] && handleFileSelection(e.target.files[0])} style={{ display: 'none' }} />
          <Box
            onClick={() => fileInputRef.current?.click()}
            {...dropProps}
            sx={{
              border: '1.5px dashed',
              borderColor: isDragOver ? '#E8A020' : selectedFile ? '#10b981' : 'rgba(17, 17, 17,0.12)',
              borderRadius: '14px', p: 4, textAlign: 'center', cursor: 'pointer',
              background: isDragOver ? 'rgba(232, 160, 32,0.1)' : selectedFile ? 'rgba(16,185,129,0.05)' : 'rgba(17, 17, 17,0.02)',
              transition: 'all 0.25s ease',
              '&:hover': { borderColor: '#E8A020', background: 'rgba(232, 160, 32,0.04)' },
            }}
          >
            {selectedFile ? (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                <CheckCircle sx={{ color: '#10b981', fontSize: 22 }} />
                <Box sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>{selectedFile.name}</Box>
              </Stack>
            ) : (
              <>
                <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(232, 160, 32,0.1)', border: '1px solid rgba(232, 160, 32,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <CloudUpload sx={{ fontSize: 26, color: '#E8A020' }} />
                </Box>
                <Box sx={{ color: '#111111', fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>Click to upload or drag and drop</Box>
                <Box sx={{ color: '#64748b', fontSize: '0.8rem' }}>MP4, AVI, MOV, WMV · Max 500MB</Box>
              </>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=…"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '14px', color: '#111111', '& fieldset': { borderColor: 'rgba(17, 17, 17, 0.1)' }, '&:hover fieldset': { borderColor: '#E8A020' }, '&.Mui-focused fieldset': { borderColor: '#E8A020' } },
              '& .MuiInputLabel-root': LABEL_SX,
            }}
          />
        </Box>
      )}

      <ActivityStrip active={loading} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained" size="large" onClick={handleSubmit}
          disabled={loading || (!selectedFile && !youtubeUrl.trim())}
          startIcon={<CloudUpload />}
          sx={{
            borderRadius: '50px', textTransform: 'none', fontWeight: 700, px: 4, py: 1.3,
            background: G, boxShadow: '0 4px 20px rgba(232, 160, 32,0.35)',
            '&:hover': { background: 'linear-gradient(135deg,#0284c7,#7c3aed)', boxShadow: '0 6px 28px rgba(232, 160, 32,0.5)', transform: 'translateY(-1px)' },
            '&.Mui-disabled': { background: 'rgba(17, 17, 17, 0.08)', color: 'rgba(17, 17, 17,0.3)', boxShadow: 'none' },
          }}
        >
          {loading ? 'Processing…' : 'Process Video'}
        </Button>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>

      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, borderLeft: '1px solid rgba(17, 17, 17,0.07)' } }}>
        {docId && <ViewVideoComponent audioId={docId} />}
      </Drawer>
    </Box>
  );
};

export default VideoCard;
