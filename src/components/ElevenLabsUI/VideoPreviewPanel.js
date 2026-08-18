import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography, Tooltip, useTheme } from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings,
  Subtitles,
} from '@mui/icons-material';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

/**
 * VideoPreviewPanel - Video player with playback controls and subtitle support
 * 
 * @param {Object} props
 * @param {string} props.videoUrl - URL of video file
 * @param {string} props.poster - Poster image URL
 * @param {Array} props.subtitles - Array of subtitle tracks {label, src, lang}
 * @param {boolean} props.showSubtitles - Whether to show subtitles by default
 * @param {Function} props.onTimeUpdate - Callback for time updates
 * @param {Function} props.onPlayStateChange - Callback for play/pause state
 * @param {Function} props.onEnded - Callback when video ends
 */
export default function VideoPreviewPanel({
  videoUrl,
  poster,
  subtitles = [],
  showSubtitles = false,
  onTimeUpdate,
  onPlayStateChange,
  onEnded,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeSubtitle, setActiveSubtitle] = useState(showSubtitles ? 0 : -1);
  const theme = useTheme();
  const controlsTimeoutRef = useRef(null);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onPlayStateChange, onEnded]);

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetControlsTimeout);
      container.addEventListener('mouseenter', resetControlsTimeout);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
        }
      });
    }

    resetControlsTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (container) {
        container.removeEventListener('mousemove', resetControlsTimeout);
        container.removeEventListener('mouseenter', resetControlsTimeout);
        container.removeEventListener('mouseleave', () => {});
      }
    };
  }, [isPlaying]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    setIsMuted(newValue === 0);
    if (videoRef.current) {
      videoRef.current.volume = newValue;
      videoRef.current.muted = newValue === 0;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  // Handle seek
  const handleSeek = (event, newValue) => {
    if (videoRef.current) {
      const time = (newValue / 100) * duration;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle subtitles
  const toggleSubtitles = () => {
    if (activeSubtitle >= 0) {
      setActiveSubtitle(-1);
    } else {
      setActiveSubtitle(0);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        bgcolor: '#000000',
        borderRadius: 2,
        overflow: 'hidden',
        aspectRatio: '16/9',
        '&:hover': {
          '& .video-controls': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        onClick={togglePlayPause}
      >
        {subtitles.map((sub, index) => (
          <track
            key={index}
            kind="subtitles"
            src={sub.src}
            srcLang={sub.lang}
            label={sub.label}
            default={index === activeSubtitle}
          />
        ))}
      </video>

      {/* Play/Pause overlay when paused */}
      {!isPlaying && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
          }}
          onClick={togglePlayPause}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(232,160,32,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                bgcolor: GOLD_DARK,
              },
              transition: 'bgcolor 0.2s ease',
            }}
          >
            <PlayArrow sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
        </Box>
      )}

      {/* Controls overlay */}
      <Box
        className="video-controls"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          px: 2,
          py: 2,
        }}
      >
        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
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
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255,255,255,0.3)',
              },
            }}
          />
        </Box>

        {/* Control buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isPlaying ? 'Pause' : 'Play'} arrow>
              <IconButton
                onClick={togglePlayPause}
                sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isMuted ? 'Unmute' : 'Mute'} arrow>
              <IconButton
                onClick={toggleMute}
                sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 100 }}>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                size="small"
                sx={{
                  color: '#ffffff',
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                  },
                }}
              />
            </Box>

            <Typography sx={{ fontSize: '0.8125rem', color: '#ffffff', ml: 1, minWidth: 100 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Box>

          {/* Right controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {subtitles.length > 0 && (
              <Tooltip title={activeSubtitle >= 0 ? 'Hide subtitles' : 'Show subtitles'} arrow>
                <IconButton
                  onClick={toggleSubtitles}
                  sx={{
                    color: activeSubtitle >= 0 ? GOLD : '#ffffff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Subtitles />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Settings" arrow>
              <IconButton
                sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <Settings />
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} arrow>
              <IconButton
                onClick={toggleFullscreen}
                sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
