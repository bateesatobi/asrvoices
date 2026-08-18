import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const PROPERTIES_PANEL_WIDTH = 320;

/**
 * StudioLayout - Center workspace + optional right properties panel + bottom bar.
 * Designed to fill the area below the dashboard top bar (height: 100%).
 */
export default function StudioLayout({
  children,
  propertiesPanel,
  showPropertiesPanel = true,
  bottomBar = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [propertiesOpen] = useState(true);

  const effectivePropertiesOpen = isMobile
    ? false
    : isTablet
      ? false
      : propertiesOpen && showPropertiesPanel;

  const propertiesWidth = effectivePropertiesOpen && propertiesPanel ? PROPERTIES_PANEL_WIDTH : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: '#FAFAFA',
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
              borderTop: '1px solid #e8e8e8',
              bgcolor: '#ffffff',
            }}
          >
            {bottomBar}
          </Box>
        )}
      </Box>

      {propertiesPanel && (
        <Box
          sx={{
            width: propertiesWidth,
            minWidth: propertiesWidth,
            maxWidth: propertiesWidth,
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: '#ffffff',
            borderLeft: '1px solid #e8e8e8',
            transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease',
            flexShrink: 0,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#fafafa' },
            '&::-webkit-scrollbar-thumb': {
              background: '#e8e8e8',
              borderRadius: 3,
              '&:hover': { background: '#d0d0d0' },
            },
          }}
        >
          {propertiesPanel}
        </Box>
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
