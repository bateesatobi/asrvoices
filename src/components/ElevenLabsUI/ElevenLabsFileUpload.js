import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { CloudUpload, Close as CloseIcon } from '@mui/icons-material';

const GOLD = '#E8A020';

/**
 * ElevenLabs-style file upload component
 * Clean drag-and-drop interface matching the modal upload design
 */
export default function ElevenLabsFileUpload({
  onFileSelect,
  accept = '*',
  maxSize = 100,
  selectedFile = null,
  onClearFile,
  children,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box>
      {selectedFile ? (
        <Box
          sx={{
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            p: 2.5,
            bgcolor: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CloudUpload sx={{ fontSize: 32, color: GOLD }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#1a1a1a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedFile.name}
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#666', mt: 0.25 }}>
              {formatFileSize(selectedFile.size)}
            </Typography>
          </Box>
          {onClearFile && (
            <IconButton
              size="small"
              onClick={onClearFile}
              sx={{
                color: '#666',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#1a1a1a' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : (
        <Box
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: isDragging ? `2px dashed ${GOLD}` : '2px dashed #e8e8e8',
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            bgcolor: isDragging ? 'rgba(232,160,32,0.04)' : '#fafafa',
            transition: 'all 0.2s ease',
            '&:hover': disabled
              ? {}
              : {
                  borderColor: GOLD,
                  bgcolor: 'rgba(232,160,32,0.04)',
                },
          }}
          onClick={() => !disabled && document.getElementById('file-upload-input').click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept={accept}
            onChange={handleFileInput}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragging ? GOLD : '#999',
              mb: 2,
            }}
          />
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 0.5,
            }}
          >
            Click or drag file here to upload
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
            {children || `Audio & video files, up to ${maxSize}MB`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
