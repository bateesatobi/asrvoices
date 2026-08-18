import React from 'react';
import { Box, Typography, Fade, CircularProgress } from '@mui/material';
import AvoicesProgress from './AvoicesProgress';

/**
 * Non-blocking studio progress — stays in the layout (no fullscreen blur).
 * Use at the top of the workspace or above a bottom player bar.
 */
export default function StudioJobProgressBar({
  open,
  message = 'Processing…',
  submessage,
  progress,
  tone = 'brand',
}) {
  if (!open) return null;

  const hasPercent = typeof progress === 'number' && progress >= 0;
  const displayProgress = hasPercent ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <Fade in={open} timeout={200}>
      <Box
        role="status"
        aria-live="polite"
        sx={{
          mb: 2,
          px: 2,
          py: 1.5,
          borderRadius: '12px',
          bgcolor: '#ffffff',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
          <CircularProgress size={18} thickness={5} sx={{ color: '#E8A020', mt: 0.25, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
              {message}
            </Typography>
            {submessage && (
              <Typography sx={{ fontSize: '0.8125rem', color: '#666', mt: 0.25, lineHeight: 1.4 }}>
                {submessage}
              </Typography>
            )}
          </Box>
        </Box>
        <AvoicesProgress
          variant={hasPercent ? 'determinate' : 'indeterminate'}
          value={displayProgress ?? 0}
          label={hasPercent ? undefined : 'Working…'}
          sublabel={hasPercent ? undefined : 'This may take a moment'}
          showValue={hasPercent}
          tone={tone}
          size="sm"
          sx={{ '& .MuiLinearProgress-root': { bgcolor: '#f0f0f0' } }}
        />
      </Box>
    </Fade>
  );
}
