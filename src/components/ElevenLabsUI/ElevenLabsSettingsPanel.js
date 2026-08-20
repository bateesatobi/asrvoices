import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
} from '@mui/material';

/**
 * ElevenLabs-style settings panel component
 * Right-side settings panel with sliders, dropdowns, and toggles
 */
export function SettingSlider({ label, value, onChange, min = 0, max = 100, step = 1, marks }) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>{value}</Typography>
      </Box>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        sx={{
          color: '#1a1a1a',
          height: 6,
          '& .MuiSlider-track': {
            border: 'none',
            bgcolor: '#1a1a1a',
          },
          '& .MuiSlider-rail': {
            bgcolor: '#e8e8e8',
            opacity: 1,
          },
          '& .MuiSlider-thumb': {
            width: 14,
            height: 14,
            bgcolor: '#1a1a1a',
            border: '2px solid #ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0 0 0 8px rgba(26,26,26,0.08)',
            },
          },
          '& .MuiSlider-mark': {
            bgcolor: 'transparent',
          },
        }}
      />
    </Box>
  );
}

export function SettingSelect({ label, value, onChange, options }) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', mb: 0.75 }}>
        {label}
      </Typography>
      <FormControl fullWidth>
        <Select
          size="small"
          value={value}
          onChange={onChange}
          sx={{
            bgcolor: '#fafafa',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            '& .MuiSelect-select': { py: 1 },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e8e8e8',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#d0d0d0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1a1a1a',
            },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export function SettingToggle({ label, checked, onChange, description }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={onChange}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#1a1a1a',
                '&:hover': {
                  bgcolor: 'rgba(26,26,26,0.08)',
                },
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                bgcolor: '#1a1a1a',
              },
            }}
          />
        }
        label={
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a' }}>
              {label}
            </Typography>
            {description && (
              <Typography sx={{ fontSize: '0.75rem', color: '#666', mt: 0.25 }}>
                {description}
              </Typography>
            )}
          </Box>
        }
        sx={{ ml: 0, width: '100%' }}
      />
    </Box>
  );
}

export function SettingSection({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          mb: 1.25,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function ElevenLabsSettingsPanel({ children, sx = {} }) {
  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        border: 'none',
        borderRadius: 0,
        p: 1.75,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
