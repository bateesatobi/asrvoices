import React from 'react';
import { TextField } from '@mui/material';

/**
 * ElevenLabs-style text field component
 * Clean input fields with subtle borders
 */
export default function ElevenLabsTextField({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 4,
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
  sx = {},
  ...props
}) {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      fullWidth={fullWidth}
      disabled={disabled}
      error={error}
      helperText={helperText}
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: '#fafafa',
          borderRadius: '8px',
          fontSize: '0.9375rem',
          '& fieldset': {
            borderColor: '#e8e8e8',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#d0d0d0',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1a1a1a',
            borderWidth: '2px',
          },
          '&.Mui-disabled': {
            bgcolor: '#f5f5f5',
            '& fieldset': {
              borderColor: '#e8e8e8',
            },
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#666',
          '&.Mui-focused': {
            color: '#1a1a1a',
          },
        },
        '& .MuiFormHelperText-root': {
          fontSize: '0.8125rem',
          mt: 1,
        },
        ...sx,
      }}
      {...props}
    />
  );
}
