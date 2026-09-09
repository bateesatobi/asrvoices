import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Tooltip, Stack, Chip,
  Breadcrumbs, Link, useMediaQuery, useTheme,
} from '@mui/material';
import {
  ChevronRight, Menu as MenuIcon, AccountBalanceWallet as WalletIcon,
  HelpOutline as HelpOutlineIcon, Notifications as NotificationsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { subscriptionAPI } from '../../services/api';
import NotificationCenter from '../NotificationCenter';
import { useTour } from '../onboarding';
import { SEGMENT_TOURS, TOUR_IDS, dashboardTour } from '../onboarding/tours';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

// ElevenLabs-style minimalist top bar
export default function ElevenLabsStyleTopBar({ isMobile, toggleDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [balance, setBalance] = useState(null);
  const [userId, setUserId] = useState(null);
  const { startTour } = useTour();

  const handleStartTour = () => {
    const seg = location.pathname.split('/').pop();
    const tour = SEGMENT_TOURS[seg];
    if (tour) {
      startTour(tour.id, tour.steps, { force: true });
    } else {
      navigate('/dashboard/home');
      setTimeout(() => startTour(TOUR_IDS.dashboard, dashboardTour, { force: true }), 350);
    }
  };

  const fetchBalance = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const uid = parsed.uid || parsed.userId;
        setUserId(uid || null);
        if (uid) {
          subscriptionAPI
            .getBalance(uid)
            .then(data => setBalance(data.balance ?? data.credit_balance ?? 0))
            .catch(() => {});
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchBalance();
    window.addEventListener('refresh-balance', fetchBalance);
    return () => window.removeEventListener('refresh-balance', fetchBalance);
  }, []);

  // Breadcrumb-style navigation
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageName = pathSegments[pathSegments.length - 1] || 'dashboard';
  const pageLabels = {
    home: 'Home',
    voices: 'Voices',
    soundtracks: 'Soundtracks',
    transcribe: 'Speech to text',
    'video-transcribe': 'Video Transcribe',
    'ad-creative': 'Ad Creative',
    translate: 'Translate',
    synthesize: 'Text to Speech',
    'voice-clone': 'Voice Cloning',
    summarize: 'Summarize',
    dubbing: 'Dubbing',
    voiceovers: 'Voiceovers',
    history: 'History',
    usage: 'Usage Analytics',
    'api-keys': 'API Keys',
    'api-reference': 'API Reference',
    'lang-support': 'Languages',
    subscription: 'Credits',
    profile: 'Profile',
    'contact-support': 'Support',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, md: 3 },
        py: 1.5,
        minHeight: 64,
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Menu button (mobile) + Breadcrumbs */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isMobile && (
          <IconButton
            onClick={toggleDrawer}
            sx={{
              color: '#666',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
            size="small"
            aria-label="Open menu"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}

        {/* Breadcrumbs - ElevenLabs style */}
        <Breadcrumbs
          separator={<ChevronRight sx={{ fontSize: 16, color: '#999' }} />}
          sx={{
            '& .MuiBreadcrumbs-separator': { mx: 0.5 },
          }}
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/dashboard/home')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666',
              '&:hover': { color: '#1a1a1a' },
            }}
          >
            <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {!isMobile && 'Home'}
          </Link>
          {pageName !== 'home' && pageName !== 'dashboard' && (
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1a1a1a',
              }}
            >
              {pageLabels[pageName] || pageName}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>

      {/* Right: Actions */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        {/* Credit balance chip */}
        <Chip
          icon={<WalletIcon sx={{ fontSize: 16, color: GOLD }} />}
          label={balance !== null ? `${balance.toFixed(2)} Credits` : '...'}
          onClick={() => navigate('/dashboard/subscription')}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            height: 32,
            fontSize: '0.8125rem',
            fontWeight: 600,
            bgcolor: 'rgba(232,160,32,0.08)',
            color: GOLD_DARK,
            border: `1px solid rgba(232,160,32,0.2)`,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(232,160,32,0.12)',
              borderColor: 'rgba(232,160,32,0.3)',
            },
            '& .MuiChip-icon': { ml: 1 },
          }}
        />

        {/* Help button */}
        <Tooltip title="Help & product tour" placement="bottom" arrow>
          <IconButton
            data-tour="help"
            onClick={handleStartTour}
            size="small"
            sx={{
              color: '#666',
              border: '1px solid #e8e8e8',
              width: 32,
              height: 32,
              '&:hover': {
                color: GOLD_DARK,
                bgcolor: 'rgba(232,160,32,0.08)',
                borderColor: 'rgba(232,160,32,0.2)',
              },
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Box data-tour="notifications" sx={{ display: 'flex' }}>
          <NotificationCenter userId={userId} />
        </Box>

        {/* User avatar */}
        <Avatar
          onClick={() => navigate('/dashboard/profile')}
          sx={{
            width: 32,
            height: 32,
            cursor: 'pointer',
            border: `1.5px solid #e8e8e8`,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              borderColor: GOLD,
            },
          }}
        />
      </Stack>
    </Box>
  );
}
