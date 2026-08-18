import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box, Avatar, Drawer as MuiDrawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Tooltip, Chip, Collapse,
  useMediaQuery, useTheme, Divider, IconButton,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Translate as TranslateIcon,
  History as HistoryIcon, Api as ApiIcon, Language as LanguageIcon,
  SupportAgent as SupportIcon, Upgrade as UpgradeIcon,
  AccountCircle as AccountCircleIcon, Logout as LogoutIcon,
  Person as PersonIcon, ExpandLess, ExpandMore,
  SettingsVoice as TranscribeIcon, Notes as SummarizeIcon,
  RecordVoiceOver as SynthIcon, Timeline as TimelineIcon,
  InterpreterMode as DubbingIcon, Mic, Mic as VoiceoverIcon,
  GridView as HomeIcon, Star as StarIcon, LibraryMusic as MusicIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import mvetlogo from '../../assets/livestock.png';

const W = 240;
const CLOSED_W = 65;

// ── AVoices Brand Colors (ElevenLabs-style light theme) ──────────────────
const GOLD = '#E8A020';
const GOLD_LIGHT = '#F5B844';
const GOLD_DARK = '#C47F10';

// Light sidebar like ElevenLabs
const sidebarBg = '#FAFAFA'; // Very light gray, almost white
const sidebarText = '#1a1a1a';
const sidebarTextSecondary = '#666666';

const openedMixin = (theme) => ({
  width: W,
  overflowX: 'hidden',
  background: sidebarBg,
  borderRight: `1px solid #e8e8e8`,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

const closedMixin = (theme) => ({
  overflowX: 'hidden',
  background: sidebarBg,
  borderRight: `1px solid #e8e8e8`,
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: { width: `calc(${theme.spacing(8)} + 1px)` },
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
});

const Drawer = styled(MuiDrawer)(({ theme, open }) => ({
  width: W,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': { borderRight: 'none' },
  ...(open ? { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) }
           : { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) }),
}));

// ElevenLabs-style nav item - subtle, clean
const NavItem = styled(ListItemButton)(({ active }) => ({
  minHeight: 40,
  borderRadius: 8,
  margin: '2px 8px',
  padding: '10px 12px',
  backgroundColor: active ? 'rgba(232,160,32,0.08)' : 'transparent',
  color: active ? GOLD_DARK : sidebarText,
  '&:hover': {
    backgroundColor: active ? 'rgba(232,160,32,0.12)' : 'rgba(0,0,0,0.04)',
    color: active ? GOLD_DARK : sidebarText,
  },
  transition: 'all 0.15s ease',
  '& .MuiListItemIcon-root': {
    color: active ? GOLD_DARK : sidebarTextSecondary,
    minWidth: 36,
    transition: 'color 0.15s',
  },
  '&:hover .MuiListItemIcon-root': {
    color: active ? GOLD_DARK : sidebarText,
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 500,
    fontSize: '0.875rem',
    letterSpacing: '-0.01em',
  },
}));

// Section label - subtle like ElevenLabs
const SectionLabel = ({ label, open }) => open ? (
  <Typography sx={{
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: sidebarTextSecondary,
    px: 2.5,
    mt: 2.5,
    mb: 0.5,
  }}>
    {label}
  </Typography>
) : <Divider sx={{ borderColor: '#e8e8e8', mx: 2, my: 1.5 }} />;

const MENU = [
  {
    section: '',
    items: [
      { label: 'Home', icon: <HomeIcon fontSize="small" />, path: '/dashboard/home' },
      { label: 'Voices', icon: <SynthIcon fontSize="small" />, path: '/dashboard/voices' },
      { label: 'Soundtracks', icon: <MusicIcon fontSize="small" />, path: '/dashboard/soundtracks' },
    ],
  },
  {
    section: 'Tools',
    items: [
      { label: 'Transcribe', icon: <TranscribeIcon fontSize="small" />, path: '/dashboard/transcribe' },
      { label: 'Translate', icon: <TranslateIcon fontSize="small" />, path: '/dashboard/translate' },
      { label: 'Text to Speech', icon: <SynthIcon fontSize="small" />, path: '/dashboard/synthesize' },
      { label: 'Summarize', icon: <SummarizeIcon fontSize="small" />, path: '/dashboard/summarize' },
      { label: 'Video & Voiceover', icon: <DubbingIcon fontSize="small" />, path: '/dashboard/video-voiceover', badge: 'New', badgeColor: 'primary' },
      // { label: 'Voice Cloning', icon: <Mic fontSize="small" />, path: '/dashboard/voice-cloning', badge: 'New', badgeColor: 'primary' },
    ],
  },
  {
    section: 'Developers',
    items: [
      { label: 'API Reference', icon: <ApiIcon fontSize="small" />, path: '/dashboard/api-reference' },
      { label: 'Languages', icon: <LanguageIcon fontSize="small" />, path: '/dashboard/lang-support' },
    ],
  },
];

export default function ElevenLabsStyleSidebar({ open, toggleDrawer }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/get-started');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) toggleDrawer();
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={isMobile ? toggleDrawer : undefined}
      ModalProps={{ keepMounted: true }}
    >
      {/* Header - ElevenLabs style with logo and workspace name */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 2,
        minHeight: 64,
        borderBottom: `1px solid #e8e8e8`,
      }}>
        <Avatar
          src={mvetlogo}
          alt="Avoices"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            flexShrink: 0,
            bgcolor: 'rgba(232,160,32,0.1)',
          }}
        />
        {open && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: sidebarText,
              lineHeight: 1.3,
            }}>
              Avoices
            </Typography>
            <Typography sx={{
              fontSize: '0.6875rem',
              color: sidebarTextSecondary,
              letterSpacing: '0.02em',
            }}>
              AI Workspace
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={toggleDrawer}
            size="small"
            sx={{
              color: sidebarTextSecondary,
              width: 28,
              height: 28,
              flexShrink: 0,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
                color: sidebarText,
              },
            }}
          >
            {open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(0,0,0,0.1)',
          borderRadius: 4,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' },
        },
      }}>
        {MENU.map(({ section, items }) => (
          <Box key={section || 'main'}>
            {section && <SectionLabel label={section} open={open} />}
            <List disablePadding>
              {items.map(({ label, icon, path, badge, badgeColor }) => (
                <ListItem key={path} disablePadding sx={{ display: 'block' }}>
                  <Tooltip title={open ? '' : label} placement="right" arrow>
                    <NavItem
                      active={isActive(path) ? 1 : 0}
                      onClick={() => handleNavClick(path)}
                      sx={{ justifyContent: open ? 'initial' : 'center' }}
                    >
                      <ListItemIcon sx={{ mr: open ? 1.5 : 'auto', justifyContent: 'center' }}>
                        {icon}
                      </ListItemIcon>
                      {open && <ListItemText primary={label} />}
                      {open && badge && (
                        <Chip
                          label={badge}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            bgcolor: badgeColor === 'primary' ? 'rgba(33,150,243,0.1)' : 'rgba(232,160,32,0.1)',
                            color: badgeColor === 'primary' ? '#1976d2' : GOLD_DARK,
                            border: 'none',
                            ml: 0.5,
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      )}
                    </NavItem>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom section - Account */}
      <Box sx={{ borderTop: `1px solid #e8e8e8`, pb: 1 }}>
        {open ? (
          <>
            <NavItem active={0} onClick={() => setAccountOpen(v => !v)} sx={{ mx: 1, mt: 0.5 }}>
              <ListItemIcon sx={{ mr: 1.5 }}>
                <AccountCircleIcon fontSize="small" sx={{ color: sidebarTextSecondary }} />
              </ListItemIcon>
              <ListItemText primary="Account" />
              {accountOpen ? (
                <ExpandLess sx={{ color: sidebarTextSecondary, fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: sidebarTextSecondary, fontSize: 18 }} />
              )}
            </NavItem>
            <Collapse in={accountOpen} unmountOnExit>
              <List disablePadding sx={{ pl: 1 }}>
                {[
                  { label: 'Profile', icon: <PersonIcon fontSize="small" />, path: '/dashboard/profile' },
                  { label: 'Usage', icon: <TimelineIcon fontSize="small" />, path: '/dashboard/usage' },
                  { label: 'Upgrade', icon: <UpgradeIcon fontSize="small" />, path: '/dashboard/subscription' },
                  { label: 'Support', icon: <SupportIcon fontSize="small" />, path: '/dashboard/contact-support' },
                ].map(({ label, icon, path }) => (
                  <ListItem key={path} disablePadding>
                    <NavItem
                      active={isActive(path) ? 1 : 0}
                      onClick={() => handleNavClick(path)}
                      sx={{ mx: 1, minHeight: 36 }}
                    >
                      <ListItemIcon sx={{ mr: 1.5, minWidth: 24 }}>{icon}</ListItemIcon>
                      <ListItemText
                        primary={label}
                        sx={{ '& .MuiListItemText-primary': { fontSize: '0.8125rem' } }}
                      />
                    </NavItem>
                  </ListItem>
                ))}
                <ListItem disablePadding>
                  <NavItem
                    active={0}
                    onClick={handleLogout}
                    sx={{
                      mx: 1,
                      minHeight: 36,
                      '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ mr: 1.5, minWidth: 24 }}>
                      <LogoutIcon fontSize="small" sx={{ color: sidebarTextSecondary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Logout"
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.8125rem',
                          color: sidebarTextSecondary,
                        },
                      }}
                    />
                  </NavItem>
                </ListItem>
              </List>
            </Collapse>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, py: 0.5 }}>
            <Tooltip title="Profile" placement="right" arrow>
              <IconButton
                onClick={() => navigate('/dashboard/profile')}
                size="small"
                sx={{
                  color: sidebarTextSecondary,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: sidebarText },
                }}
              >
                <AccountCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" placement="right" arrow>
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  color: sidebarTextSecondary,
                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)', color: '#f44336' },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
