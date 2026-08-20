import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Grid, Avatar, IconButton, Chip, Paper, Stack, Button, Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  SettingsVoice as TranscribeIcon,
  Translate as TranslateIcon,
  RecordVoiceOver as SynthIcon,
  Notes as SummarizeIcon,
  Movie as DubbingIcon,
  GraphicEq as VoiceoverIcon,
  AutoAwesome,
  AccountBalanceWallet as WalletIcon,
  History as HistoryIcon,
  ArrowForward,
  Bolt,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { subscriptionAPI } from '../../services/api';
import {
  fetchAllVaultActivity,
  readAllVaultActivityCache,
  computeVaultMetrics,
  formatRelativeDate,
  isProcessingStatus,
} from '../../utils/mediaVault';
import { HOME_STORIES, TYPE_SCENE } from '../../data/studioVisuals';
import { useTour } from '../onboarding';
import { TOUR_IDS, dashboardTour } from '../onboarding/tours';
import DashboardUsageSummary from './DashboardUsageSummary';

const GOLD = '#E8A020';
const GLASS = {
  background: 'rgba(17, 17, 17, 0.02)',
  border: '1px solid rgba(17, 17, 17, 0.05)',
  borderRadius: '20px',
};

const TYPE_ICON = {
  transcription: <TranscribeIcon sx={{ fontSize: 18 }} />,
  video: <TranscribeIcon sx={{ fontSize: 18 }} />,
  translation: <TranslateIcon sx={{ fontSize: 18 }} />,
  tts: <SynthIcon sx={{ fontSize: 18 }} />,
  document_tts: <SynthIcon sx={{ fontSize: 18 }} />,
  summary: <SummarizeIcon sx={{ fontSize: 18 }} />,
  dubbing: <DubbingIcon sx={{ fontSize: 18 }} />,
  voiceover: <VoiceoverIcon sx={{ fontSize: 18 }} />,
  vox: <SynthIcon sx={{ fontSize: 18 }} />,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StoryTile({ story, onOpen }) {
  const [usePoster, setUsePoster] = useState(!story.video);
  useEffect(() => {
    setUsePoster(!story.video);
  }, [story.video]);

  return (
    <Box
      onClick={() => onOpen(story.path)}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '18px',
        overflow: 'hidden',
        minHeight: { xs: 160, md: 200 },
        bgcolor: '#111',
        '&:hover .story-label': { transform: 'translateY(-2px)' },
      }}
    >
      {story.video && !usePoster ? (
        <Box
          component="video"
          src={story.video}
          poster={story.image}
          muted
          loop
          playsInline
          autoPlay
          onError={() => setUsePoster(true)}
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Box
          component="img"
          src={story.image}
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      <Box className="story-label" sx={{ position: 'relative', zIndex: 1, p: 2.25, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', transition: 'transform 0.18s' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>
          {story.title}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', mt: 0.35 }}>
          {story.desc}
        </Typography>
      </Box>
    </Box>
  );
}

export default function DashboardHomeElevenLabs({ userId }) {
  const navigate = useNavigate();
  const { startTour } = useTour();

  const [balance, setBalance] = useState(0);
  const [analytics, setAnalytics] = useState({});
  const [ledger, setLedger] = useState([]);
  const [activity, setActivity] = useState(() => readAllVaultActivityCache(userId) || []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userName = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const name = u.displayName || u.name || u.email || '';
      return name ? String(name).split('@')[0].split(' ')[0] : '';
    } catch {
      return '';
    }
  }, []);

  const loadAll = useCallback(async ({ force = false } = {}) => {
    if (!userId) return;
    try {
      force ? setRefreshing(true) : setLoading(true);
      const [balRes, analyticsRes, ledgerRes, vault] = await Promise.all([
        subscriptionAPI.getBalance(userId).catch(() => ({})),
        subscriptionAPI.getAnalytics(userId).catch(() => ({})),
        subscriptionAPI.getLedger(userId, 1, 60).catch(() => ({})),
        fetchAllVaultActivity(userId, { force }).catch(() => []),
      ]);
      setBalance(balRes.balance ?? balRes.credit_balance ?? 0);
      setAnalytics(analyticsRes.analytics || {});
      setLedger(ledgerRes.ledger || []);
      setActivity(Array.isArray(vault) ? vault : []);
      window.dispatchEvent(new CustomEvent('refresh-balance'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
    const onUpdate = () => loadAll({ force: true });
    window.addEventListener('library-updated', onUpdate);
    return () => window.removeEventListener('library-updated', onUpdate);
  }, [loadAll]);

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => startTour(TOUR_IDS.dashboard, dashboardTour), 700);
    return () => clearTimeout(t);
  }, [loading, startTour]);

  const metrics = useMemo(() => computeVaultMetrics(activity), [activity]);
  const recent = useMemo(() => activity.slice(0, 6), [activity]);

  if (loading && !activity.length) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 5, mb: 3, bgcolor: 'rgba(17,17,17,0.05)' }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, bgcolor: 'rgba(17,17,17,0.05)' }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 5, bgcolor: 'rgba(17,17,17,0.05)' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: '1.35rem', md: '1.75rem' },
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            {greeting()}{userName ? `, ${userName}` : ''}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#666', mt: 0.5 }}>
            Pick a story, or continue recent work.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            data-tour="stat-balance"
            icon={<WalletIcon sx={{ fontSize: '16px !important', color: `${GOLD} !important` }} />}
            label={`${Number(balance).toLocaleString()} credits`}
            onClick={() => navigate('/dashboard/subscription')}
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(232,160,32,0.1)',
              color: '#1a1a1a',
              cursor: 'pointer',
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
          <Chip
            data-tour="stat-progress"
            icon={<Bolt sx={{ fontSize: '16px !important' }} />}
            label={`${metrics.processing} in progress`}
            onClick={() => navigate('/dashboard/usage')}
            sx={{ fontWeight: 700, bgcolor: 'rgba(245,158,11,0.12)', color: '#d97706', cursor: 'pointer' }}
          />
          <IconButton
            onClick={() => loadAll({ force: true })}
            disabled={refreshing}
            sx={{ color: '#999', '&:hover': { color: GOLD, bgcolor: 'rgba(232,160,32,0.08)' } }}
            aria-label="Refresh dashboard"
          >
            <RefreshIcon
              fontSize="small"
              sx={{ animation: refreshing ? 'spin 1.2s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }}
            />
          </IconButton>
        </Stack>
      </Stack>

      <Grid data-tour="quick-actions" container spacing={1.5} sx={{ mb: 3 }}>
        {HOME_STORIES.map((story) => (
          <Grid item xs={12} sm={6} md={3} key={story.id}>
            <StoryTile story={story} onOpen={navigate} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper data-tour="recent-projects" sx={{ ...GLASS, p: 0, overflow: 'hidden', height: '100%' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ p: 2.5, borderBottom: '1px solid rgba(17,17,17,0.05)' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <HistoryIcon sx={{ color: GOLD, fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9375rem' }}>
                    Recent activity
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#999' }}>
                    {metrics.total} asset{metrics.total === 1 ? '' : 's'} in your library
                  </Typography>
                </Box>
              </Stack>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/dashboard/usage')}
                sx={{ textTransform: 'none', fontWeight: 700, color: GOLD }}
              >
                View all
              </Button>
            </Stack>

            {recent.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>No projects yet</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#999', mb: 2 }}>
                  Open a story above — finished jobs show up here with a thumbnail.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/dashboard/transcribe')}
                  sx={{
                    background: 'linear-gradient(135deg, #E8A020, #C47F10)',
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Start transcribing
                </Button>
              </Box>
            ) : (
              <Stack divider={<Box sx={{ borderBottom: '1px solid rgba(17,17,17,0.04)' }} />}>
                {recent.map((row, i) => {
                  const processing = isProcessingStatus(row._status);
                  const clickable = !!row._viewPath;
                  const thumb = TYPE_SCENE[row._vaultType];
                  return (
                    <Stack
                      key={row.doc_id || i}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      onClick={() => clickable && navigate(row._viewPath)}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        cursor: clickable ? 'pointer' : 'default',
                        '&:hover': { bgcolor: clickable ? 'rgba(232,160,32,0.04)' : 'transparent' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          bgcolor: `${row._vaultColor || GOLD}14`,
                          position: 'relative',
                        }}
                      >
                        {thumb ? (
                          <Box component="img" src={thumb} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: `${row._vaultColor || GOLD}14`,
                              color: row._vaultColor || GOLD,
                              borderRadius: '12px',
                            }}
                          >
                            {TYPE_ICON[row._vaultType] || <AutoAwesome sx={{ fontSize: 18 }} />}
                          </Avatar>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: '#1a1a1a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row._title || 'Untitled'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: '#999' }}>
                          {row._vaultLabel} · {formatRelativeDate(row._date)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={processing ? 'Processing' : row._status === 'failed' ? 'Failed' : 'Ready'}
                        sx={{
                          height: 20,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          bgcolor: processing ? 'rgba(245,158,11,0.12)' : row._status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color: processing ? '#d97706' : row._status === 'failed' ? '#ef4444' : '#10b981',
                        }}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <DashboardUsageSummary
            balance={balance}
            analytics={analytics}
            ledger={ledger}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
