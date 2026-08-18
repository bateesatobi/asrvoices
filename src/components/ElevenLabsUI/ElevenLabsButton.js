import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

/**
 * ElevenLabs-style button component
 * Clean buttons with subtle styling
 */
export default function ElevenLabsButton({
  children,
  variant = 'contained',
  size = 'medium',
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  sx = {},
  ...props
}) {
  const getButtonStyles = () => {
    if (variant === 'contained') {
      return {
        bgcolor: '#1a1a1a',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: size === 'large' ? '0.9375rem' : '0.875rem',
        textTransform: 'none',
        borderRadius: '8px',
        px: size === 'large' ? 3 : 2.5,
        py: size === 'large' ? 1.5 : 1.25,
        boxShadow: 'none',
        border: 'none',
        '&:hover': {
          bgcolor: '#333333',
          boxShadow: 'none',
        },
        '&:disabled': {
          bgcolor: '#e8e8e8',
          color: '#999999',
        },
      };
    }

    if (variant === 'primary') {
      return {
        bgcolor: GOLD,
        color: '#1a1a1a',
        fontWeight: 600,
        fontSize: size === 'large' ? '0.9375rem' : '0.875rem',
        textTransform: 'none',
        borderRadius: '8px',
        px: size === 'large' ? 3 : 2.5,
        py: size === 'large' ? 1.5 : 1.25,
        boxShadow: 'none',
        border: 'none',
        '&:hover': {
          bgcolor: GOLD_DARK,
          boxShadow: '0 4px 12px rgba(232, 160, 32, 0.25)',
        },
        '&:disabled': {
          bgcolor: '#e8e8e8',
          color: '#999999',
        },
      };
    }

    if (variant === 'outlined') {
      return {
        bgcolor: 'transparent',
        color: '#1a1a1a',
        fontWeight: 600,
        fontSize: size === 'large' ? '0.9375rem' : '0.875rem',
        textTransform: 'none',
        borderRadius: '8px',
        px: size === 'large' ? 3 : 2.5,
        py: size === 'large' ? 1.5 : 1.25,
        border: '1px solid #e8e8e8',
        boxShadow: 'none',
        '&:hover': {
          bgcolor: '#fafafa',
          borderColor: '#d0d0d0',
          boxShadow: 'none',
        },
        '&:disabled': {
          borderColor: '#e8e8e8',
          color: '#999999',
        },
      };
    }

    // text variant
    return {
      bgcolor: 'transparent',
      color: '#666666',
      fontWeight: 500,
      fontSize: size === 'large' ? '0.9375rem' : '0.875rem',
      textTransform: 'none',
      borderRadius: '8px',
      px: size === 'large' ? 2 : 1.5,
      py: size === 'large' ? 1.25 : 1,
      boxShadow: 'none',
      '&:hover': {
        bgcolor: 'rgba(0,0,0,0.04)',
        boxShadow: 'none',
      },
      '&:disabled': {
        color: '#999999',
      },
    };
  };

  return (
    <Button
      variant="text"
      fullWidth={fullWidth}
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : startIcon}
      endIcon={!loading && endIcon}
      sx={{
        ...getButtonStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
