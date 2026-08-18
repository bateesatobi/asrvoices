import React, { useCallback } from 'react';
import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GetAppIcon from '@mui/icons-material/GetApp';
import WaveformTimeline from './WaveformTimeline';
import { dataAPI, getCurrentUser } from '../services/api';
import { trimAudioClientSide, downloadBlobFile, guessMediaExtension } from '../utils/mediaTrim';
import { rvPrimaryButtonSx, RV_AC } from './result-view/resultViewTokens';

/**
 * Trim + export panel for audio/video/slideshow results.
 * Uses server-side ffmpeg trim when available; falls back to client audio trim.
 */
export default function MediaTrimEditor({
  url,
  video = false,
  filename = 'trimmed',
  onNotify,
  ensureExport,
  segments = [],
  emptyLabel,
  height = 88,
}) {
  const [trimRange, setTrimRange] = React.useState({ start: 0, end: 0 });
  const [exporting, setExporting] = React.useState(false);
  const previewRef = React.useRef(null);

  const handleTrimChange = useCallback((start, end) => {
    setTrimRange({ start, end });
  }, []);

  const handlePreview = useCallback(() => {
    previewRef.current?.();
  }, []);

  const handleExport = useCallback(async () => {
    if (!url) return;
    if (ensureExport && !(await ensureExport())) return;

    const startMs = Math.round(trimRange.start * 1000);
    const endMs = Math.round(trimRange.end * 1000);
    if (endMs <= startMs) {
      onNotify?.('Select a valid trim range', 'error');
      return;
    }

    setExporting(true);
    try {
      const { userId } = getCurrentUser();
      const ext = guessMediaExtension(url, video);
      const outName = `${filename}${ext}`;

      try {
        const blob = await dataAPI.trimMedia(url, startMs, endMs, userId, video ? 'video' : 'audio');
        downloadBlobFile(blob, outName);
        onNotify?.('Trimmed file downloaded', 'success');
        return;
      } catch {
        if (video) throw new Error('video trim failed');
      }

      const wavBlob = await trimAudioClientSide(url, trimRange.start, trimRange.end);
      downloadBlobFile(wavBlob, `${filename}.wav`);
      onNotify?.('Trimmed audio downloaded', 'success');
    } catch {
      onNotify?.('Could not export trim. Check your connection or try again.', 'error');
    } finally {
      setExporting(false);
    }
  }, [url, video, filename, trimRange, ensureExport, onNotify]);

  if (!url) return null;

  const duration = Math.max(0, trimRange.end - trimRange.start);

  return (
    <Box>
      <WaveformTimeline
        url={url}
        video={video}
        segments={segments}
        height={height}
        emptyLabel={emptyLabel}
        enableTrim
        onTrimChange={handleTrimChange}
        onPreviewTrimRef={previewRef}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{
          mt: 2,
          p: 2,
          borderRadius: '14px',
          border: '1px solid rgba(232, 160, 32, 0.22)',
          background: 'rgba(232, 160, 32, 0.04)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <ContentCutIcon sx={{ color: RV_AC, fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#111' }}>
              Trim selection
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17,17,17,0.55)', fontVariantNumeric: 'tabular-nums' }}>
              {duration > 0 ? `${duration.toFixed(1)}s selected` : 'Drag handles on the waveform to trim'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handlePreview}
            disabled={duration <= 0}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(232,160,32,0.35)', color: RV_AC }}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <GetAppIcon />}
            onClick={handleExport}
            disabled={exporting || duration <= 0}
            sx={{ ...rvPrimaryButtonSx, minWidth: 140 }}
          >
            {exporting ? 'Exporting…' : 'Export trim'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
