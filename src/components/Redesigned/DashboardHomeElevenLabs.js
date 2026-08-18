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
  AccountBalanceWallet as WalletIcon,
  History as HistoryIcon,
  ArrowForward,
  Bolt,
  AutoAwesome,
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
import { useTour } from '../onboarding';
import { TOUR_IDS, dashboardTour } from '../onboarding/tours';
import DashboardUsageSummary from './DashboardUsageSummary';

const GOLD = '#E8A020';
const GLASS = {
  background: 'rgba(17, 17, 17, 0.02)',
  border: '1px solid rgba(17, 17, 17, 0.05)',
  borderRadius: '20px',
};

const QUICK_ACTIONS = [
  { id: 'transcribe', label: 'Transcribe', desc: 'Speech to text', icon: <TranscribeIcon />, path: '/dashboard/transcribe', color: GOLD },
  { id: 'translate', label: 'Translate', desc: 'Text & documents', icon: <TranslateIcon />, path: '/dashboard/translate', color: '#10b981' },
  { id: 'synthesize', label: 'Text to Speech', desc: 'Neural voices', icon: <SynthIcon />, path: '/dashboard/synthesize', color: '#C47F10' },
  { id: 'summarize', label: 'Summarize', desc: 'Condense content', icon: <SummarizeIcon />, path: '/dashboard/summarize', color: '#8b5cf6' },
  { id: 'dubbing', label: 'Video Dubbing', desc: 'Translate videos', icon: <DubbingIcon />, path: '/dashboard/video-voiceover', color: '#3b82f6' },
  { id: 'voiceovers', label: 'Voiceovers', desc: 'Narration & slideshow', icon: <VoiceoverIcon />, path: '/dashboard/video-voiceover', color: '#ec4899' },
];

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
  const totalSpent = useMemo(
    () => Object.values(analytics).reduce((a, b) => a + b, 0),
    [analytics]
  );
  const hoursSaved = (totalSpent * 0.05).toFixed(1);

  if (loading && !activity.length) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 5, mb: 3, bgcolor: 'rgba(17,17,17,0.05)' }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={6} md={2} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4, bgcolor: 'rgba(17,17,17,0.05)' }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 5, bgcolor: 'rgba(17,17,17,0.05)' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Greeting + quick actions */}
      <Paper sx={{ ...GLASS, p: { xs: 2.5, md: 3 }, mb: 3, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,160,32,0.12), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
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
              What would you like to create today?
            </Typography>
          </Box>
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

        <Grid data-tour="quick-actions" container spacing={1.5}>
          {QUICK_ACTIONS.map((action) => (
            <Grid item xs={6} sm={4} md={2} key={action.id}>
              <Box
                onClick={() => navigate(action.path)}
                sx={{
                  cursor: 'pointer',
                  p: 2,
                  borderRadius: '14px',
                  height: '100%',
                  bgcolor: '#fff',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.18s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    borderColor: `${action.color}55`,
                  },
                }}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 36,
                    height: 36,
                    mb: 1,
                    bgcolor: `${action.color}14`,
                    color: action.color,
                    borderRadius: '10px',
                  }}
                >
                  {action.icon}
                </Avatar>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                  {action.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: '#999', mt: 0.25 }}>
                  {action.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Credit Balance', value: balance.toLocaleString(), icon: <WalletIcon />, color: GOLD, tour: 'stat-balance', action: () => navigate('/dashboard/subscription') },
          { label: 'Total Assets', value: metrics.total, icon: <HistoryIcon />, color: '#3b82f6', action: () => navigate('/dashboard/usage') },
          { label: 'In Progress', value: metrics.processing, icon: <Bolt />, color: '#f59e0b', tour: 'stat-progress', action: () => navigate('/dashboard/usage') },
          { label: 'Hours Saved', value: `${hoursSaved}h`, icon: <AutoAwesome />, color: '#10b981', action: () => navigate('/dashboard/usage') },
        ].map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Paper
              data-tour={stat.tour}
              onClick={stat.action}
              sx={{
                ...GLASS,
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.18s',
                '&:hover': { transform: 'translateY(-2px)', borderColor: `${stat.color}40` },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{ width: 38, height: 38, bgcolor: `${stat.color}14`, color: stat.color, borderRadius: '10px' }}
                >
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, mt: 0.4 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent activity + usage */}
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
                <Typography sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9375rem' }}>
                  Recent activity
                </Typography>
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
                <AutoAwesome sx={{ fontSize: 40, color: 'rgba(17,17,17,0.12)', mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>No projects yet</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#999', mb: 2 }}>
                  Start with one of the studios above — your work will appear here.
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
                  Start creating
                </Button>
              </Box>
            ) : (
              <Stack divider={<Box sx={{ borderBottom: '1px solid rgba(17,17,17,0.04)' }} />}>
                {recent.map((row, i) => {
                  const processing = isProcessingStatus(row._status);
                  const clickable = !!row._viewPath;
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
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: `${row._vaultColor || GOLD}14`,
                          color: row._vaultColor || GOLD,
                          borderRadius: '10px',
                        }}
                      >
                        {TYPE_ICON[row._vaultType] || <AutoAwesome sx={{ fontSize: 18 }} />}
                      </Avatar>
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
