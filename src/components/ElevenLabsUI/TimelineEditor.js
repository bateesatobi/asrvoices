import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Slider, Typography, Tooltip, useTheme } from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  ZoomIn,
  ZoomOut,
  Add as AddIcon,
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

/**
 * TimelineEditor - Waveform timeline with playback controls
 * 
 * @param {Object} props
 * @param {string} props.audioUrl - URL of audio file
 * @param {boolean} props.showAddSegment - Show "Add segment" button
 * @param {Function} props.onAddSegment - Callback when add segment clicked
 * @param {Function} props.onTimeUpdate - Callback for time updates
 * @param {Function} props.onPlayStateChange - Callback for play/pause state
 * @param {Array} props.segments - Array of segment markers {start, end, color}
 */
export default function TimelineEditor({
  audioUrl,
  showAddSegment = true,
  onAddSegment,
  onTimeUpdate,
  onPlayStateChange,
  segments = [],
}) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(100);
  const theme = useTheme();

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#e8e8e8',
      progressColor: GOLD,
      cursorColor: GOLD_DARK,
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 80,
      normalize: true,
      autoplay: false,
      interact: true,
    });

    ws.load(audioUrl);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      const time = ws.getCurrentTime();
      setCurrentTime(time);
      onTimeUpdate?.(time);
    });

    ws.on('play', () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    });

    ws.on('pause', () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newValue);
    }
  };

  // Handle zoom change
  const handleZoomChange = (event, newValue) => {
    setZoom(newValue);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newValue);
    }
  };

  // Handle seek
  const handleSeek = (event, newValue) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(newValue / 100);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Waveform container */}
      <Box
        ref={containerRef}
        sx={{
          px: 2,
          pt: 2,
          '& wave': {
            borderRadius: '4px',
          },
        }}
      />

      {/* Time ruler */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 2,
          pb: 1,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          0:00
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          {formatTime(duration / 4)}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          {formatTime(duration / 2)}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          {formatTime(duration * 0.75)}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          {formatTime(duration)}
        </Typography>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderTop: '1px solid #f0f0f0',
          bgcolor: '#fafafa',
        }}
      >
        {/* Playback controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Previous segment" arrow>
            <IconButton size="small" sx={{ color: '#666666' }}>
              <SkipPrevious fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPlaying ? 'Pause' : 'Play'} arrow>
            <IconButton
              onClick={togglePlayPause}
              sx={{
                bgcolor: GOLD,
                color: '#ffffff',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: GOLD_DARK,
                },
              }}
            >
              {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Next segment" arrow>
            <IconButton size="small" sx={{ color: '#666666' }}>
              <SkipNext fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography sx={{ fontSize: '0.8125rem', color: '#666666', ml: 1, minWidth: 80 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Box>

        {/* Zoom controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Zoom out" arrow>
            <IconButton
              size="small"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              sx={{ color: '#666666' }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', minWidth: 40 }}>
            {zoom}%
          </Typography>
          <Tooltip title="Zoom in" arrow>
            <IconButton
              size="small"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              sx={{ color: '#666666' }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Volume control */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 120 }}>
          <VolumeUp sx={{ fontSize: 18, color: '#666666' }} />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            size="small"
            sx={{
              color: GOLD,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
            }}
          />
        </Box>

        {/* Add segment button */}
        {showAddSegment && (
          <Box
            onClick={onAddSegment}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 2,
              py: 1,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: 'rgba(232,160,32,0.08)',
              color: GOLD_DARK,
              fontSize: '0.8125rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(232,160,32,0.12)',
              },
              transition: 'all 0.15s ease',
            }}
          >
            <AddIcon fontSize="small" />
            Add segment
          </Box>
        )}
      </Box>

      {/* Progress slider */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Slider
          value={duration > 0 ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          size="small"
          sx={{
            color: GOLD,
            '& .MuiSlider-thumb': {
              width: 14,
              height: 14,
            },
          }}
        />
      </Box>
    </Box>
  );
}
