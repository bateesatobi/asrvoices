import React, { useCallback, useEffect, useState } from 'react';
import { Box, Drawer, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChevronRight, Tune } from '@mui/icons-material';

const PANEL_WIDTH = 268;
const RAIL_WIDTH = 44;
const STORAGE_KEY = 'avoices-studio-inspector-open';

function readStoredOpen() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * Studio workspace: center canvas + collapsible right inspector + optional bottom bar.
 */
export default function StudioLayout({
  children,
  propertiesPanel,
  showPropertiesPanel = true,
  bottomBar = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(readStoredOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  const persist = useCallback((next) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const hasPanel = Boolean(propertiesPanel) && showPropertiesPanel;
  const desktopOpen = hasPanel && !isMobile && open;
  const desktopRail = hasPanel && !isMobile && !open;
  const inspectorWidth = desktopOpen ? PANEL_WIDTH : desktopRail ? RAIL_WIDTH : 0;

  const inspectorHeader = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.25,
        py: 0.85,
        minHeight: 44,
        borderBottom: '1px solid #ececec',
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#888',
        }}
      >
        Settings
      </Typography>
      {!isMobile ? (
        <Tooltip title="Collapse settings">
          <IconButton
            size="small"
            aria-label="Collapse settings"
            onClick={() => persist(false)}
            sx={{ color: '#888', '&:hover': { color: '#111', bgcolor: 'rgba(17,17,17,0.04)' } }}
          >
            <ChevronRight sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      ) : (
        <IconButton
          size="small"
          aria-label="Close settings"
          onClick={() => setMobileOpen(false)}
          sx={{ color: '#888' }}
        >
          <ChevronRight sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </Box>
  );

  const inspectorBody = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: '#fff' }}>
      {inspectorHeader}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>{propertiesPanel}</Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: '#FAFAFA',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</Box>
        {bottomBar && (
          <Box
            sx={{
              flexShrink: 0,
              borderTop: '1px solid #ececec',
              bgcolor: '#ffffff',
            }}
          >
            {bottomBar}
          </Box>
        )}
      </Box>

      {hasPanel && !isMobile && (
        <Box
          sx={{
            width: inspectorWidth,
            minWidth: inspectorWidth,
            maxWidth: inspectorWidth,
            height: '100%',
            bgcolor: '#ffffff',
            borderLeft: '1px solid #ececec',
            transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {desktopOpen ? (
            inspectorBody
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 1,
                gap: 1.5,
              }}
            >
              <Tooltip title="Open settings" placement="left">
                <IconButton
                  aria-label="Open settings"
                  onClick={() => persist(true)}
                  sx={{
                    color: '#111',
                    bgcolor: 'rgba(232,160,32,0.12)',
                    '&:hover': { bgcolor: 'rgba(232,160,32,0.22)' },
                  }}
                >
                  <Tune sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Typography
                sx={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#aaa',
                  userSelect: 'none',
                }}
              >
                Settings
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {hasPanel && isMobile && (
        <>
          <Tooltip title="Settings">
            <IconButton
              aria-label="Open settings"
              onClick={() => setMobileOpen(true)}
              sx={{
                position: 'absolute',
                right: 12,
                top: 12,
                zIndex: 8,
                bgcolor: '#111',
                color: '#fff',
                width: 40,
                height: 40,
                boxShadow: '0 8px 24px rgba(17,17,17,0.18)',
                '&:hover': { bgcolor: '#222' },
              }}
            >
              <Tune sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Drawer
            anchor="right"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            PaperProps={{
              sx: {
                width: 'min(100%, 300px)',
                bgcolor: '#fff',
              },
            }}
          >
            {inspectorBody}
          </Drawer>
        </>
      )}
    </Box>
  );
}

export function StudioLayoutHeader({ onToggleProperties, propertiesOpen, title, subtitle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  if (isMobile) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        borderBottom: '1px solid #e8e8e8',
        bgcolor: '#ffffff',
      }}
    >
      <Box>
        {title && (
          <Box sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            {title}
          </Box>
        )}
        {subtitle && (
          <Box sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>{subtitle}</Box>
        )}
      </Box>
      {onToggleProperties && (
        <Box
          onClick={onToggleProperties}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 1,
            cursor: 'pointer',
            color: '#666666',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#1a1a1a' },
            transition: 'all 0.15s ease',
          }}
        >
          <Box sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {propertiesOpen ? 'Hide' : 'Show'} Properties
          </Box>
        </Box>
      )}
    </Box>
  );
}
