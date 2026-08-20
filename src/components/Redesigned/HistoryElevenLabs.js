import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Chip, Stack } from '@mui/material';
import {
  Mic, VideoCameraBack, TextFields, VolumeUp, RecordVoiceOver, Summarize,
  Dashboard, Refresh, Description, GraphicEq,
} from '@mui/icons-material';
import { ElevenLabsButton } from '../ElevenLabsUI';
import DataTable from '../DataTable.js';
import VideoTable from '../VideoTable';
import TranslationsTable from '../TranslationsTable';
import SummaryTable from '../SummaryTable';
import VoxTransTable from '../VoxTransTable.js';
import TextTable from '../TextTable.js';
import DubbedVideosTable from '../DubbedVideosTable';
import VoiceoverTable from '../VoiceoverTable';
import DocumentTtsTable from '../DocumentTtsTable';
import AllActivityFeed from '../AllActivityFeed';
import { getCurrentUser } from '../../services/api';
import {
  computeVaultMetrics, fetchAllVaultActivity,
  readAllVaultActivityCache, invalidateVaultCache,
} from '../../utils/mediaVault';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

const FEATURES = [
  { id: 'all', Icon: Dashboard, label: 'All Activity', color: GOLD, Component: AllActivityFeed, isFeed: true },
  { id: 'translation', Icon: TextFields, label: 'Translation', color: GOLD, Component: TranslationsTable },
  { id: 'tts', Icon: VolumeUp, label: 'Text to Speech', color: GOLD_DARK, Component: TextTable },
  { id: 'document_tts', Icon: Description, label: 'Document Speech', color: GOLD_DARK, Component: DocumentTtsTable },
  { id: 'transcription', Icon: Mic, label: 'Voice Recognition', color: GOLD, Component: DataTable },
  { id: 'video', Icon: VideoCameraBack, label: 'Video Transcription', color: GOLD_DARK, Component: VideoTable },
  { id: 'dubbing', Icon: VideoCameraBack, label: 'Video Dubbing', color: GOLD, Component: DubbedVideosTable },
  { id: 'voiceover', Icon: GraphicEq, label: 'Voiceovers', color: GOLD, Component: VoiceoverTable },
  { id: 'vox', Icon: RecordVoiceOver, label: 'Voice to Voice', color: GOLD, Component: VoxTransTable },
  { id: 'summary', Icon: Summarize, label: 'Summarization', color: GOLD_DARK, Component: SummaryTable },
];

const STAT_CHIPS = [
  { key: 'total', label: 'assets', filter: { view: 'all' } },
  { key: 'processing', label: 'in progress', filter: { view: 'all', status: 'processing' } },
  { key: 'thisWeek', label: 'this week', filter: { view: 'all' } },
];

export default function HistoryElevenLabs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewParam = searchParams.get('view') || 'all';
  const statusParam = searchParams.get('status') || 'all';

  const selectedIndex = Math.max(0, FEATURES.findIndex(f => f.id === viewParam));
  const selected = FEATURES[selectedIndex] || FEATURES[0];

  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, processing: 0, thisWeek: 0, byType: {} });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const refreshKeyRef = useRef(0);

  const handleMetrics = useCallback((entries) => {
    setMetrics(computeVaultMetrics(entries));
    setMetricsLoading(false);
  }, []);

  const refreshLibrary = useCallback(() => {
    const user = getCurrentUser();
    const userId = user?.userId || user?.uid;
    if (userId) invalidateVaultCache(userId);
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      const user = getCurrentUser();
      const userId = user?.userId || user?.uid;
      if (!userId) { setMetricsLoading(false); return; }

      const force = refreshKey !== refreshKeyRef.current;
      refreshKeyRef.current = refreshKey;

      const cached = readAllVaultActivityCache(userId);
      if (cached?.length && !force) {
        handleMetrics(cached);
        return;
      }
      if (!cached?.length) setMetricsLoading(true);

      try {
        const entries = await fetchAllVaultActivity(userId, { force });
        handleMetrics(entries);
      } catch {
        setMetricsLoading(false);
      }
    };
    loadMetrics();
  }, [refreshKey, handleMetrics]);

  useEffect(() => {
    const onUpdate = () => refreshLibrary();
    window.addEventListener('library-updated', onUpdate);
    return () => window.removeEventListener('library-updated', onUpdate);
  }, [refreshLibrary]);

  const setView = useCallback((id, extra = {}) => {
    const params = new URLSearchParams();
    params.set('view', id);
    if (extra.status) params.set('status', extra.status);
    else if (statusParam && id === 'all') params.set('status', statusParam);
    setSearchParams(params);
  }, [setSearchParams, statusParam]);

  const statValues = useMemo(() => ({
    total: metrics.total.toLocaleString('en-US'),
    processing: metrics.processing.toLocaleString('en-US'),
    thisWeek: metrics.thisWeek.toLocaleString('en-US'),
  }), [metrics]);

  const ActiveComponent = selected.Component;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            History
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>
            One table per studio — not a stack of cards
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {STAT_CHIPS.map(({ key, label, filter }) => (
            <Chip
              key={key}
              label={`${metricsLoading ? '…' : statValues[key]} ${label}`}
              onClick={() => filter && setView(filter.view, { status: filter.status })}
              sx={{ fontWeight: 700, bgcolor: 'rgba(232,160,32,0.1)', color: '#1a1a1a' }}
            />
          ))}
          <ElevenLabsButton variant="outlined" onClick={refreshLibrary} startIcon={<Refresh />}>
            Refresh
          </ElevenLabsButton>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {FEATURES.map((feat, i) => {
          const count = feat.id === 'all' ? metrics.total : (metrics.byType[feat.id] ?? null);
          return (
            <Chip
              key={feat.id}
              icon={<feat.Icon sx={{ fontSize: 16 }} />}
              label={count != null ? `${feat.label} (${count})` : feat.label}
              onClick={() => setView(feat.id)}
              sx={{
                height: 32,
                fontWeight: 600,
                fontSize: '0.8125rem',
                bgcolor: selectedIndex === i ? 'rgba(232,160,32,0.1)' : 'transparent',
                color: selectedIndex === i ? GOLD_DARK : '#666666',
                border: selectedIndex === i ? '1px solid rgba(232,160,32,0.25)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {selected.isFeed ? (
          <AllActivityFeed
            refreshKey={refreshKey}
            onMetrics={handleMetrics}
            statusFilter={statusParam !== 'all' ? statusParam : undefined}
          />
        ) : (
          <ActiveComponent refreshKey={refreshKey} />
        )}
      </Box>
    </Box>
  );
}
