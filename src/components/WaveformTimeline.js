import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Stack, IconButton, Typography, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const AC = '#E8A020';
const TRIM_COLOR = 'rgba(239, 68, 68, 0.22)';

function fmt(t) {
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Waveform + segment timeline (Descript/HeyGen-style) built on wavesurfer.js.
 *
 * Props:
 *  - url:        audio or video URL to visualize/play
 *  - video:      when true, renders a <video> element and binds wavesurfer to it
 *  - segments:   [{ start, end, text, label }] in seconds (regions drawn when timed)
 *  - height:     waveform height (px)
 *  - emptyLabel: text shown when there are no segments
 *  - enableTrim: show draggable/resizable trim region + expose onTrimChange
 *  - onTrimChange: (startSec, endSec) => void
 *  - onPreviewTrimRef: ref object whose .current becomes preview function
 */
export default function WaveformTimeline({
  url,
  video = false,
  segments = [],
  height = 88,
  emptyLabel,
  enableTrim = false,
  onTrimChange,
  onPreviewTrimRef,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const regionsRef = useRef(null);
  const trimRegionRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [failed, setFailed] = useState(false);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });

  const timed = segments.filter(s => Number(s.end) > Number(s.start));
  const hasTimes = timed.length > 0;
  const isCrossOrigin = Boolean(
    url && typeof window !== 'undefined' && !url.startsWith(window.location.origin),
  );

  const emitTrim = useCallback((start, end) => {
    setTrimRange({ start, end });
    onTrimChange?.(start, end);
  }, [onTrimChange]);

  useEffect(() => {
    if (!containerRef.current || !url) return undefined;
    let ws;
    let cancelled = false;
    try {
      const regions = RegionsPlugin.create();
      regionsRef.current = regions;
      const opts = {
        container: containerRef.current,
        waveColor: 'rgba(17,17,17,0.18)',
        progressColor: AC,
        cursorColor: enableTrim ? '#ef4444' : AC,
        barWidth: 2,
        barGap: 1,
        barRadius: 3,
        height,
        normalize: true,
        plugins: [regions],
      };
      if (video && videoRef.current) opts.media = videoRef.current;
      else opts.url = url;

      ws = WaveSurfer.create(opts);
      wsRef.current = ws;

      ws.on('ready', () => {
        if (cancelled) return;
        const dur = ws.getDuration();
        setReady(true);
        setDuration(dur);
        timed.forEach((s, i) => {
          regions.addRegion({
            start: Number(s.start),
            end: Number(s.end),
            drag: false,
            resize: false,
            color: `rgba(232,160,32,${i % 2 ? 0.10 : 0.18})`,
          });
        });

        if (enableTrim) {
          const end = dur > 1 ? dur * 0.95 : dur;
          const trimRegion = regions.addRegion({
            id: 'trim',
            start: 0,
            end,
            drag: true,
            resize: true,
            color: TRIM_COLOR,
          });
          trimRegionRef.current = trimRegion;
          emitTrim(trimRegion.start, trimRegion.end);
          trimRegion.on('update-end', () => {
            emitTrim(trimRegion.start, trimRegion.end);
          });
        }
      });
      ws.on('timeupdate', (t) => {
        setCurrent(t);
        if (hasTimes) setActiveIdx(segments.findIndex(s => t >= Number(s.start) && t <= Number(s.end)));
        if (enableTrim && trimRegionRef.current && t >= trimRegionRef.current.end) {
          ws.pause();
        }
      });
      ws.on('play', () => setPlaying(true));
      ws.on('pause', () => setPlaying(false));
      ws.on('finish', () => setPlaying(false));
      ws.on('error', () => setFailed(true));
      regions.on('region-clicked', (region, e) => {
        if (region.id === 'trim') return;
        e.stopPropagation();
        ws.setTime(region.start);
        ws.play();
      });
    } catch {
      setFailed(true);
    }
    return () => {
      cancelled = true;
      trimRegionRef.current = null;
      regionsRef.current = null;
      try { if (ws) ws.destroy(); } catch { /* already torn down */ }
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, video, height, enableTrim]);

  const togglePlay = useCallback(() => {
    const ws = wsRef.current;
    if (ws && !failed) ws.playPause();
  }, [failed]);

  const seekTo = useCallback((sec) => {
    const ws = wsRef.current;
    if (ws && !failed) {
      ws.setTime(sec);
      ws.play();
    } else if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play();
    }
  }, [failed]);

  const previewTrim = useCallback(() => {
    const ws = wsRef.current;
    const region = trimRegionRef.current;
    if (!ws || !region) return;
    ws.setTime(region.start);
    ws.play();
  }, []);

  useEffect(() => {
    if (onPreviewTrimRef) {
      onPreviewTrimRef.current = previewTrim;
    }
  }, [onPreviewTrimRef, previewTrim]);

  return (
    <Box>
      {video && (
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 920 },
            mx: 'auto',
            mb: 2,
            borderRadius: '18px',
            overflow: 'hidden',
            background: '#0a0a0a',
            border: '1px solid rgba(232,160,32,0.18)',
            boxShadow: '0 20px 56px rgba(17,17,17,0.16)',
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000' }}>
            <video
              ref={videoRef}
              src={url}
              controls
              playsInline
              {...(isCrossOrigin ? { crossOrigin: 'anonymous' } : {})}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                background: '#000',
              }}
            />
          </Box>
        </Box>
      )}

      {!failed && (
        <Box sx={{ borderRadius: '14px', border: '1px solid rgba(17,17,17,0.07)', background: 'rgba(17,17,17,0.02)', p: 1.5, mb: hasTimes ? 2 : 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {!video && (
              <IconButton onClick={togglePlay} disabled={!ready} sx={{ background: AC, color: '#111', width: 40, height: 40, flexShrink: 0, '&:hover': { background: '#C47F10' }, '&.Mui-disabled': { background: 'rgba(17,17,17,0.1)' } }}>
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }} ref={containerRef} />
            <Stack alignItems="flex-end" spacing={0.25} sx={{ flexShrink: 0, minWidth: 88 }}>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(17,17,17,0.55)', textAlign: 'right' }}>
                {fmt(current)} / {fmt(duration)}
              </Typography>
              {enableTrim && trimRange.end > trimRange.start && (
                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>
                  {fmt(trimRange.start)} → {fmt(trimRange.end)}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      )}

      {failed && video && (
        <Typography sx={{ fontSize: '0.78rem', color: 'rgba(17,17,17,0.45)', mt: 1 }}>
          Waveform preview unavailable — use the video player above.
        </Typography>
      )}

      {failed && !video && (
        <audio controls src={url} crossOrigin="anonymous" style={{ width: '100%' }} />
      )}

      {hasTimes && (
        <Stack spacing={0.75} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
          {segments.map((s, i) => {
            const isActive = i === activeIdx;
            const isTimed = Number(s.end) > Number(s.start);
            return (
              <Stack
                key={i}
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                onClick={() => isTimed && seekTo(Number(s.start))}
                sx={{
                  p: 1.25,
                  borderRadius: '10px',
                  cursor: isTimed ? 'pointer' : 'default',
                  background: isActive ? 'rgba(232,160,32,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(232,160,32,0.35)' : 'rgba(17,17,17,0.05)'}`,
                  transition: 'background 0.15s, border-color 0.15s',
                  '&:hover': { background: isTimed ? 'rgba(232,160,32,0.07)' : 'transparent' },
                }}
              >
                <Chip
                  label={fmt(Number(s.start))}
                  size="small"
                  sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', bgcolor: isActive ? AC : 'rgba(17,17,17,0.06)', color: isActive ? '#111' : 'rgba(17,17,17,0.6)', flexShrink: 0, mt: 0.2 }}
                />
                <Typography sx={{ fontSize: '0.84rem', color: '#111111', lineHeight: 1.5 }}>
                  {s.text || s.label || `Segment ${i + 1}`}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}

      {!hasTimes && emptyLabel && (
        <Typography sx={{ fontSize: '0.78rem', color: 'rgba(17,17,17,0.4)', mt: 1.5 }}>{emptyLabel}</Typography>
      )}
    </Box>
  );
}
