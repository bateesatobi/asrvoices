import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

/**
 * ElevenLabs-style card component
 * Clean white cards with subtle borders and hover effects
 */
export default function ElevenLabsCard({
  children,
  title,
  subtitle,
  action,
  elevation = 0,
  sx = {},
  ...props
}) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        bgcolor: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#d0d0d0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        ...sx,
      }}
      {...props}
    >
      {(title || action) && (
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            {title && (
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#666',
                  mt: 0.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}
