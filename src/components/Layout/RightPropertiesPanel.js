import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

/**
 * PropertySection - Collapsible section for properties panel
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Optional subtitle
 * @param {boolean} props.defaultOpen - Default expanded state
 * @param {React.ReactNode} props.children - Section content
 * @param {React.ReactNode} props.action - Optional action button/element
 */
export function PropertySection({ title, subtitle, defaultOpen = true, children, action }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box sx={{ borderBottom: '1px solid #f0f0f0' }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.75,
          py: 1.15,
          cursor: 'pointer',
          bgcolor: '#ffffff',
          '&:hover': { bgcolor: '#fafafa' },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#666666',
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {action}
          <IconButton
            size="small"
            sx={{
              color: '#999999',
              p: 0.5,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
                color: '#1a1a1a',
              },
            }}
          >
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Section Content */}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 1.75, py: 1.25, bgcolor: '#fafafa' }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * PropertyRow - Key-value pair row
 * 
 * @param {Object} props
 * @param {string} props.label - Property label
 * @param {React.ReactNode} props.value - Property value
 * @param {string} props.valueColor - Optional color for value
 */
export function PropertyRow({ label, value, valueColor }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        py: 1,
        borderBottom: '1px solid #f0f0f0',
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.8125rem',
          color: '#666666',
          fontWeight: 500,
          flex: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.8125rem',
          color: valueColor || '#1a1a1a',
          fontWeight: 500,
          textAlign: 'right',
          ml: 2,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * PropertyGroup - Group of related properties
 * 
 * @param {Object} props
 * @param {string} props.label - Group label
 * @param {React.ReactNode} props.children - Property rows
 */
export function PropertyGroup({ label, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999999',
          mb: 1.5,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          bgcolor: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/**
 * RightPropertiesPanel - Main properties panel component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Property sections or content
 * @param {string} props.title - Optional panel title
 */
export default function RightPropertiesPanel({ children, title }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
      }}
    >
      {title && (
        <Box
          sx={{
            px: 1.75,
            py: 1.25,
            borderBottom: '1px solid #e8e8e8',
            bgcolor: '#ffffff',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
