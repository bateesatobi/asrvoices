import React, { useState, useEffect } from 'react';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import {
  langLabel, truncateText, formatDurationMins, resolveRowTitle, isProcessingStatus,
} from '../../utils/mediaVault';

function formatElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function StatusChip({ status, startedAt, progress }) {
  const s = (status || 'completed').toLowerCase();
  const processing = isProcessingStatus(s);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!processing || !startedAt) {
      setElapsed(0);
      return undefined;
    }
    const start = new Date(startedAt).getTime();
    if (Number.isNaN(start)) return undefined;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [processing, startedAt]);

  let color = 'success';
  let label = 'Completed';
  if (processing) {
    color = 'warning';
    label = startedAt ? `Processing · ${formatElapsed(elapsed)}` : 'Processing';
  } else if (s === 'failed' || s === 'error') {
    color = 'error';
    label = 'Failed';
  } else if (s === 'partial') {
    color = 'warning';
    label = 'Partial';
  }

  const pct = processing && progress != null && progress > 0 ? Math.min(100, progress) : null;

  return (
    <Stack spacing={0.5} sx={{ minWidth: 100 }}>
      <Chip
        label={label}
        size="small"
        color={color}
        sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24, alignSelf: 'flex-start' }}
      />
      {pct != null && (
        <Box sx={{ width: 88 }}>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )}
    </Stack>
  );
}

export function TitleCell({ row, subtitle, titleOverride }) {
  const title = titleOverride || resolveRowTitle(row);
  return (
    <Box sx={{ minWidth: 0, maxWidth: 320 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: '#111111', lineHeight: 1.3 }} noWrap>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'rgba(17,17,17,0.45)', display: 'block', mt: 0.25 }} noWrap>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export function LangChip({ code }) {
  return (
    <Chip
      label={langLabel(code)}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
    />
  );
}

export function MetaText({ children }) {
  return (
    <Typography variant="body2" sx={{ color: 'rgba(17,17,17,0.55)', fontSize: '0.8rem' }} noWrap>
      {children || '—'}
    </Typography>
  );
}

export function LangPair({ source, target }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <LangChip code={source} />
      {target && (
        <>
          <Typography sx={{ color: 'rgba(17,17,17,0.35)', fontSize: '0.75rem' }}>→</Typography>
          <LangChip code={target} />
        </>
      )}
    </Stack>
  );
}

export { truncateText, formatDurationMins, langLabel, resolveRowTitle };
