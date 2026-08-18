import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { StudioLayout, RightPropertiesPanel } from '../ElevenLabsUI';

const centerSx = (maxWidth) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  px: { xs: 2, md: 4 },
  py: { xs: 2, md: 3 },
  maxWidth,
  mx: 'auto',
  width: '100%',
});

/**
 * Standard studio page layout — center workspace + right Settings/History panel + optional bottom bar.
 */
export default function StudioPageShell({
  icon,
  title,
  subtitle,
  children,
  footer,
  settingsContent,
  bottomBar = null,
  showPropertiesPanel = true,
  maxWidth = 920,
  'data-tour': dataTour,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const propertiesPanel =
    showPropertiesPanel && !isMobile && settingsContent ? (
      <RightPropertiesPanel>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>{settingsContent}</Box>
      </RightPropertiesPanel>
    ) : null;

  return (
    <StudioLayout
      propertiesPanel={propertiesPanel}
      showPropertiesPanel={Boolean(propertiesPanel)}
      bottomBar={bottomBar}
    >
      <Box data-tour={dataTour} sx={centerSx(maxWidth)}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: subtitle ? 2 : 3 }}>
          {icon && (
            <Box sx={{ color: '#1a1a1a', display: 'flex', mt: 0.25 }}>{icon}</Box>
          )}
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.25rem' },
                fontWeight: 600,
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: '0.875rem', color: '#666', mt: 0.5, lineHeight: 1.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</Box>

        {footer && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f0f0f0' }}>{footer}</Box>
        )}
      </Box>
    </StudioLayout>
  );
}

export function StudioResultPane({ label, children, actions }) {
  return (
    <Box
      sx={{
        mt: 3,
        pt: 3,
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 160,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
        {actions}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>{children}</Box>
    </Box>
  );
}

export function StudioHistoryList({ items, emptyMessage, onItemClick, renderItem }) {
  if (!items?.length) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: '#999', py: 4, textAlign: 'center', px: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }
  return (
    <Box sx={{ py: 1 }}>
      {items.map((item, index) => (
        <Box
          key={item.id || index}
          onClick={() => onItemClick?.(item)}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #f0f0f0',
            cursor: onItemClick ? 'pointer' : 'default',
            '&:hover': onItemClick ? { bgcolor: '#fafafa' } : {},
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          {renderItem(item)}
        </Box>
      ))}
    </Box>
  );
}
