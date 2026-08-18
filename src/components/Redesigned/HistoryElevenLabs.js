import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Grid, IconButton, Tooltip, Chip, Stack,
  useMediaQuery, useTheme, Button,
} from '@mui/material';
import {
  Mic, VideoCameraBack, TextFields, VolumeUp, RecordVoiceOver, Summarize,
  Dashboard, Refresh, Description, GraphicEq,
} from '@mui/icons-material';
import {
  ElevenLabsCard,
  ElevenLabsButton,
} from '../ElevenLabsUI';
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

const STAT_CARDS = [
  { key: 'total', label: 'Total Assets', filter: { view: 'all' } },
  { key: 'processing', label: 'In Progress', filter: { view: 'all', status: 'processing' } },
  { key: 'thisWeek', label: 'This Week', filter: { view: 'all' } },
  { key: 'types', label: 'Asset Types', filter: null },
];

export default function HistoryElevenLabs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    types: Object.keys(metrics.byType).length.toString(),
  }), [metrics]);

  const ActiveComponent = selected.Component;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            History
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>
            View all your past projects and activities
          </Typography>
        </Box>
        <ElevenLabsButton
          variant="outlined"
          onClick={refreshLibrary}
          startIcon={<Refresh />}
        >
          Refresh
        </ElevenLabsButton>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2}>
        {STAT_CARDS.map(({ key, label, filter }) => (
          <Grid item xs={6} md={3} key={key}>
            <ElevenLabsCard
              onClick={() => filter && setView(filter.view, { status: filter.status })}
              sx={{
                cursor: filter ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': filter ? { transform: 'translateY(-2px)' } : {},
              }}
            >
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: GOLD_DARK, mb: 1 }}>
                {label}
              </Typography>
              {metricsLoading && key !== 'types' ? (
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#999999' }}>
                  ...
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
                  {statValues[key]}
                </Typography>
              )}
            </ElevenLabsCard>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <ElevenLabsCard sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Service Filter Tabs */}
        <Box sx={{ borderBottom: '1px solid #e8e8e8', px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', overflowX: 'auto' }}>
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
                    bgcolor: selectedIndex === i ? 'rgba(232,160,32,0.1)' : '#f5f5f5',
                    color: selectedIndex === i ? GOLD_DARK : '#666666',
                    border: selectedIndex === i ? `1px solid rgba(232,160,32,0.2)` : '1px solid #e8e8e8',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: selectedIndex === i ? 'rgba(232,160,32,0.15)' : '#e8e8e8',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
                {selected.label}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>
                {selected.id === 'all'
                  ? 'Chronological view across every studio'
                  : `Browsing your saved ${selected.label.toLowerCase()}`}
              </Typography>
            </Box>
          </Box>

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
      </ElevenLabsCard>
    </Box>
  );
}
