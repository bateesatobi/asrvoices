/**
 * Background Music (BGM) Components for VoiceoverStudio
 * 
 * Includes:
 * - BGMCard: Individual track display with preview
 * - BGMSelectionDialog: Modal for track selection
 * - BGMControlPanel: UI for BGM toggle and volume control
 * 
 * To integrate: Copy these components into VoiceoverStudio.js and use them in the JSX render
 */

import React, { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Stack, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Slider, Switch
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp, VolumeOff as VolumeOffIcon,
  MusicNote,
  CheckCircle
} from '@mui/icons-material';
import { BASE_URL } from '../services/api';

const AC = '#E8A020';

/* ─── BGM Card Component ─────────────────────────────────────────────────── */
export function BGMCard({ track, isSelected, onSelect, onPreview, isPlaying, onStopPreview }) {
  const [loading, setLoading] = useState(false);
  
  const handlePreview = async () => {
    if (isPlaying) {
      onStopPreview();
      return;
    }
    
    setLoading(true);
    try {
      // Fetch and play BGM track
      const response = await fetch(`${BASE_URL}/bgm-stream/${track.filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        onPreview(url);
      }
    } catch (err) {
      console.error('Failed to preview BGM:', err);
    } finally {
      setLoading(false);
    }
  };

  const moodColors = {
    'Professional, energetic': '#3b82f6',
    'Calm, peaceful': '#10b981',
    'Energetic, positive': '#E8A020',
    'Epic, dramatic': '#8b5cf6',
    'Relaxed, contemporary': '#ec4899'
  };

  const moodColor = moodColors[track.mood] || AC;

  return (
    <Box
      onClick={() => onSelect(track)}
      sx={{
        p: 2,
        borderRadius: '12px',
        cursor: 'pointer',
        border: isSelected ? `2px solid ${AC}` : '1px solid rgba(17, 17, 17, 0.1)',
        background: isSelected ? `${AC}08` : 'rgba(17, 17, 17, 0.02)',
        boxShadow: isSelected ? `0 4px 15px -4px ${AC}66` : 'none',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          background: isSelected ? `${AC}12` : 'rgba(245,158,11,0.06)',
          borderColor: isSelected ? AC : 'rgba(232, 160, 32,0.28)',
          transform: 'translateY(-1px)'
        },
      }}
    >
      <Stack spacing={1.5}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#111111', mb: 0.3 }}>
              {track.name}
            </Typography>
            <Chip
              icon={<MusicNote sx={{ fontSize: 12 }} />}
              label={track.mood}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
                background: `${moodColor}15`,
                color: moodColor,
                border: `1px solid ${moodColor}30`,
                '& .MuiChip-icon': { color: moodColor, marginLeft: '4px !important' }
              }}
            />
          </Box>
          {isSelected && (
            <CheckCircle sx={{ color: AC, fontSize: 20, flexShrink: 0 }} />
          )}
        </Stack>

        {/* Meta info */}
        <Stack direction="row" spacing={2} sx={{ fontSize: '0.7rem', color: 'rgba(17, 17, 17, 0.5)', fontWeight: 600 }}>
          <Box>⏱ {track.duration}s</Box>
          <Box>♪ {track.bpm} BPM</Box>
        </Stack>

        {/* Preview button */}
        <Button
          size="small"
          startIcon={isPlaying ? <PauseIcon sx={{ fontSize: 14 }} /> : <PlayIcon sx={{ fontSize: 14 }} />}
          onClick={e => {
            e.stopPropagation();
            handlePreview();
          }}
          disabled={loading}
          sx={{
            width: '100%',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.75rem',
            background: isPlaying ? 'rgba(244, 63, 94, 0.12)' : `${AC}15`,
            color: isPlaying ? '#f43f5e' : AC,
            border: `1px solid ${isPlaying ? 'rgba(244, 63, 94, 0.3)' : `${AC}30`}`,
            '&:hover': {
              background: isPlaying ? 'rgba(244, 63, 94, 0.2)' : `${AC}25`
            }
          }}
        >
          {loading ? 'Loading…' : isPlaying ? 'Stop Preview' : 'Play Sample'}
        </Button>
      </Stack>
    </Box>
  );
}

/* ─── BGM Selection Dialog ──────────────────────────────────────────────── */
export function BGMSelectionDialog({ open, onClose, onSelect, selectedTrackId, bgmTracks, onPreview, previewingTrackId }) {
  const audioRef = useRef(null);

  const handleStopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onPreview(null);
  };

  const handlePreview = async (url) => {
    handleStopPreview();
    if (url && audioRef.current) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
        onPreview(url);
      } catch (err) {
        console.error('Playback failed:', err);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', borderBottom: '1px solid rgba(17,17,17,0.1)' }}>
        Select Background Music
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {bgmTracks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <MusicNote sx={{ fontSize: 40, color: 'rgba(17, 17, 17, 0.1)', mb: 1 }} />
            <Typography sx={{ color: 'rgba(17, 17, 17, 0.4)', fontWeight: 600 }}>No background music available</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {bgmTracks.map(track => (
              <Grid item xs={12} sm={6} key={track.id}>
                <BGMCard
                  track={track}
                  isSelected={selectedTrackId === track.id}
                  onSelect={onSelect}
                  onPreview={handlePreview}
                  isPlaying={previewingTrackId === track.id}
                  onStopPreview={handleStopPreview}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(17,17,17,0.1)' }}>
        <Button onClick={onClose} sx={{ color: 'rgba(17,17,17,0.6)', fontWeight: 700 }}>Cancel</Button>
        <Button variant="contained" onClick={onClose} sx={{ background: AC, fontWeight: 800 }}>Done</Button>
      </DialogActions>
      <audio ref={audioRef} onEnded={() => onPreview(null)} />
    </Dialog>
  );
}

/* ─── BGM Control Panel Component ──────────────────────────────────────────── */
export function BGMControlPanel({
  enableBGM,
  setEnableBGM,
  selectedBGM,
  bgmVolume,
  setBgmVolume,
  onOpenDialog,
  mode = 'narration'
}) {
  const GLASS = {
    background: 'rgba(17, 17, 17,0.025)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(17, 17, 17,0.07)',
    borderRadius: '20px',
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 3, ...GLASS, p: 2.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} justifyContent="space-between" sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <MusicNote sx={{ fontSize: 22, color: AC }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#111111' }}>
              Background Music
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(17, 17, 17, 0.5)', mt: 0.25 }}>
              Add royalty-free music to enhance your {mode === 'slideshow' ? 'slideshow' : 'narration'}
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          {/* Enable/Disable Toggle */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              checked={enableBGM}
              onChange={(e) => setEnableBGM(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: AC,
                  '& + .MuiSwitch-track': {
                    backgroundColor: AC,
                    opacity: 0.3,
                  }
                }
              }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: enableBGM ? AC : 'rgba(17, 17, 17, 0.4)' }}>
              {enableBGM ? 'BGM Enabled' : 'Add Music'}
            </Typography>
          </Stack>
          
          {/* Open BGM Selector */}
          {enableBGM && (
            <>
              <Box sx={{
                p: 1.5,
                borderRadius: '10px',
                background: selectedBGM ? `${AC}12` : 'rgba(17, 17, 17, 0.04)',
                border: `1px solid ${selectedBGM ? `${AC}30` : 'rgba(17, 17, 17, 0.08)'}`,
                minWidth: 200,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { background: `${AC}18` }
              }}
              onClick={onOpenDialog}>
                {selectedBGM ? (
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#111111' }}>
                      ♪ {selectedBGM.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(17, 17, 17, 0.5)' }}>
                      {selectedBGM.mood}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'rgba(17, 17, 17, 0.4)' }}>
                    Select a track…
                  </Typography>
                )}
              </Box>
              
              {/* Volume Control */}
              <Box sx={{ minWidth: 220 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <VolumeOffIcon sx={{ fontSize: 16, color: 'rgba(17, 17, 17, 0.3)' }} />
                  <Slider
                    value={bgmVolume}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(_, v) => setBgmVolume(v)}
                    sx={{
                      flex: 1,
                      height: 3,
                      color: AC,
                      '& .MuiSlider-thumb': { width: 12, height: 12 }
                    }}
                  />
                  <VolumeUp sx={{ fontSize: 16, color: AC }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: AC, minWidth: 30 }}>
                    {Math.round(bgmVolume * 100)}%
                  </Typography>
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
