import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, LinearProgress, Avatar } from '@mui/material';
import {
  PlayArrow,
  Pause,
  Replay10,
  Forward10,
  Download,
  ExpandMore,
} from '@mui/icons-material';

const GOLD = '#E8A020';

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Fixed bottom playback bar — matches ElevenLabs TTS studio layout.
 */
export default function StudioPlayerBar({
  voiceName = 'Select a voice',
  voiceLang = '',
  audioUrl,
  disabled = false,
  onDownload,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [audioUrl]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  };

  const skip = (delta) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  const ready = Boolean(audioUrl) && !disabled;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 3 },
        py: 1.5,
        minHeight: 72,
        bgcolor: '#ffffff',
      }}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: ready ? GOLD : '#e8e8e8',
            color: ready ? '#fff' : '#999',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {voiceName?.[0] || '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a', maxWidth: 180 }}
          >
            {voiceName}
          </Typography>
          {voiceLang && (
            <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
              {voiceLang.toUpperCase()}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, maxWidth: 520, mx: 'auto' }}>
        <IconButton size="small" disabled={!ready} onClick={() => skip(-10)} sx={{ color: '#666' }}>
          <Replay10 fontSize="small" />
        </IconButton>
        <IconButton
          disabled={!ready}
          onClick={togglePlay}
          sx={{
            bgcolor: ready ? '#1a1a1a' : '#e8e8e8',
            color: '#fff',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: ready ? '#333' : '#e8e8e8' },
            '&.Mui-disabled': { color: '#bbb' },
          }}
        >
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton size="small" disabled={!ready} onClick={() => skip(10)} sx={{ color: '#666' }}>
          <Forward10 fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '0.75rem', color: '#999', minWidth: 72, textAlign: 'center' }}>
          {formatTime(current)} / {formatTime(duration)}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 80 }}>
          <LinearProgress
            variant="determinate"
            value={duration ? (current / duration) * 100 : 0}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: '#e8e8e8',
              '& .MuiLinearProgress-bar': { bgcolor: '#1a1a1a', borderRadius: 2 },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          disabled={!ready}
          onClick={onDownload}
          sx={{ color: '#666', '&:hover': { color: '#1a1a1a' } }}
        >
          <Download fontSize="small" />
        </IconButton>
        <IconButton size="small" disabled sx={{ color: '#ccc' }}>
          <ExpandMore fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
